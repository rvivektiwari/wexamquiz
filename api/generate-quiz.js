const admin = require('../lib/firebase-admin');

// --- Constants ---
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_PRIMARY = 'meta-llama/llama-3.3-70b-instruct';
const MODEL_FALLBACK = 'google/gemma-2-9b-it';

const MAX_TEXT_LENGTH = 15000;
const MAX_QUESTION_COUNT = 50;

// --- Helpers ---

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildPrompt(text, difficulty, type, count) {
    let questionTypeInstruction = '';
    switch (type.toLowerCase()) {
        case 'mcq':
            questionTypeInstruction = `Generate ${count} multiple-choice questions (MCQ). Each question MUST have exactly 4 options.`;
            break;
        case 'short':
            questionTypeInstruction = `Generate ${count} short-answer questions. Each question should require a 1-3 sentence answer.`;
            break;
        case 'long':
            questionTypeInstruction = `Generate ${count} long-answer questions. Each question should require a detailed paragraph answer.`;
            break;
        case 'mixed':
            questionTypeInstruction = `Generate ${count} questions with a mix of MCQ, short-answer, and long-answer types. For MCQ questions, include exactly 4 options.`;
            break;
        default:
            questionTypeInstruction = `Generate ${count} multiple-choice questions (MCQ). Each question MUST have exactly 4 options.`;
    }

    return `${questionTypeInstruction}
Difficulty: ${difficulty}

STRICT RULES:
1. Use ONLY the provided study text below.
2. Do NOT use external knowledge.
3. Do NOT invent facts.
4. If the answer to a question is not found in the text, skip it.
5. Match difficulty definitions strictly.

DIFFICULTY DEFINITIONS:
Easy: Direct recall, definitions, simple MCQs
Medium: Concept understanding, reason-based, 2-3 mark style
Hard: Analytical, compare and contrast, multi-step reasoning
HOTS: Case-based, real-life application, evaluation and analysis

For MCQ: each question must have exactly 4 options and one correct answer.
For short/long: provide a model answer in the "answer" field.
Note: For short and long type questions, the "options" field should be an empty array [].

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "",
      "type": "mcq|short|long",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct answer",
      "explanation": "Brief explanation of the answer"
    }
  ]
}

STUDY TEXT:
"""
${text}
"""`;
}

function validateQuizResponse(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.questions)) return false;
    if (data.questions.length === 0) return false;

    for (const q of data.questions) {
        if (!q.question || typeof q.question !== 'string') return false;
        if (!q.answer || typeof q.answer !== 'string') return false;

        if (q.type === 'mcq' || (q.options && q.options.length > 0)) {
            if (!Array.isArray(q.options) || q.options.length !== 4) return false;
        }
    }
    return true;
}

function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1].trim());
            } catch (e2) { }
        }
        const jsonMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e3) { }
        }
        return null;
    }
}

/**
 * Call OpenRouter API with specific model
 * Handles JSON extraction and validation retry (recursion)
 */
async function callAI(prompt, model, retryCount = 0) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not set.');
    }

    console.log(`Calling OpenRouter with model: ${model} (attempt ${retryCount + 1})`);

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://wexam.app',
            'X-Title': 'Wexam QuizLab'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an advanced exam paper generator. You generate high-quality structured exam questions strictly from provided study material. You must respond with ONLY valid JSON, no other text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.4,
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response structure from OpenRouter');
    }

    const content = result.choices[0].message.content;
    const parsed = extractJSON(content);

    if (!parsed || !validateQuizResponse(parsed)) {
        if (retryCount < 1) {
            console.log('AI response validation failed, retrying same model...');
            return callAI(prompt, model, retryCount + 1);
        }
        throw new Error('AI generated invalid quiz format after retry');
    }

    return parsed;
}

/**
 * Orchestrator: Tries primary model, falls back to backup model
 */
async function generateQuizWithFallback(prompt) {
    try {
        return await callAI(prompt, MODEL_PRIMARY);
    } catch (error) {
        console.warn(`Primary model (${MODEL_PRIMARY}) failed:`, error.message);
        console.log(`Attempting fallback to (${MODEL_FALLBACK})...`);

        try {
            return await callAI(prompt, MODEL_FALLBACK);
        } catch (fallbackError) {
            console.error(`Fallback model (${MODEL_FALLBACK}) also failed:`, fallbackError.message);
            throw new Error('Both AI models failed to generate a valid quiz. Please try again later.');
        }
    }
}

// --- Main Handler ---

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        // 1. Verify Authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
        }
        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (authError) {
            console.error('Auth verification failed:', authError);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        const uid = decodedToken.uid;

        // 2. Check Rate Limit (10 per day)
        // Stored in Firestore at: quizUsage/{uid}_{date}
        const today = new Date().toISOString().split('T')[0];
        const userUsageRef = admin.firestore().collection('quizUsage').doc(`${uid}_${today}`);

        await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(userUsageRef);
            let currentCount = 0;
            if (doc.exists) {
                currentCount = doc.data().count || 0;
            }
            if (currentCount >= 10) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            t.set(userUsageRef, {
                userId: uid,
                date: today,
                count: currentCount + 1,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        // 3. Process Request
        let { text, difficulty, type, count } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text content is missing.' });
        }

        // Sanitize & Truncate
        text = sanitizeText(text);
        if (text.length > MAX_TEXT_LENGTH) {
            text = text.substring(0, MAX_TEXT_LENGTH);
        }
        if (text.length < 50) {
            return res.status(400).json({ error: 'Text is too short to generate a quiz.' });
        }

        const validDifficulties = ['easy', 'medium', 'hard', 'hots'];
        if (!difficulty || !validDifficulties.includes(difficulty.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid difficulty level.' });
        }

        const validTypes = ['mcq', 'short', 'long', 'mixed'];
        if (!type || !validTypes.includes(type.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid question type.' });
        }

        count = parseInt(count, 10);
        if (isNaN(count) || count < 1 || count > MAX_QUESTION_COUNT) {
            return res.status(400).json({ error: `Count must be between 1 and ${MAX_QUESTION_COUNT}` });
        }

        // 4. Generate Quiz with Fallback
        const prompt = buildPrompt(text, difficulty, type, count);
        const quizData = await generateQuizWithFallback(prompt);

        return res.json(quizData);

    } catch (error) {
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
            return res.status(429).json({ error: 'You have reached your daily limit of 10 quizzes. Please try again tomorrow.' });
        }

        console.error('Quiz generation error:', error);

        let userMessage = 'Failed to generate quiz. Please try again.';
        if (error.message.includes('401')) {
            userMessage = 'Server configuration error: Invalid API key.';
        } else if (error.message.includes('402')) {
            userMessage = 'Server quota exceeded. Please contact support.';
        } else if (error.message.includes('Both AI models failed')) {
            userMessage = 'AI service is currently unavailable. Please try again later.';
        }

        return res.status(500).json({ error: userMessage });
    }
};
