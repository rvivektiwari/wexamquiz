import { db, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, increment, addDoc, serverTimestamp, where, getDocs, query, limit, Timestamp } from "../config/firebase-config.js";

export const DBService = {
    // =============================================
    // DICTIONARY — Existing methods (untouched)
    // =============================================

    // Create or update user profile on login
    createUserProfile: async (user) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || null,
                createdAt: new Date().toISOString(),
                savedWords: [],
                searchHistory: [],
                wordsLearned: 0
            });
        }
    },

    // Get user profile data
    getUserProfile: async (userId) => {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    },

    // Update user profile data
    updateUserProfile: async (userId, data) => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, data);
    },

    // Save a word to the user's list (Subcollection)
    saveWord: async (userId, wordData) => {
        const wordId = wordData.word.toLowerCase().trim();
        const wordRef = doc(db, "users", userId, "savedWords", wordId);

        await setDoc(wordRef, {
            ...wordData,
            wordId: wordId,
            savedAt: new Date().toISOString()
        });

        // Update stats
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wordsLearned: increment(1)
        });
    },

    // Remove a word from the user's list (Subcollection)
    removeWord: async (userId, word) => {
        const wordId = word.toLowerCase().trim();
        const wordRef = doc(db, "users", userId, "savedWords", wordId);
        await deleteDoc(wordRef);

        // Update stats
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            wordsLearned: increment(-1)
        });
    },

    // Check if word is saved
    isWordSaved: async (userId, word) => {
        const wordId = word.toLowerCase().trim();
        const wordRef = doc(db, "users", userId, "savedWords", wordId);
        const docSnap = await getDoc(wordRef);
        return docSnap.exists();
    },

    // Add to search history
    addToHistory: async (userId, word) => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            searchHistory: arrayUnion({ word, timestamp: new Date().toISOString() })
        });
    },

    // Listen to user data (saved words)
    subscribeToUserData: (userId, callback) => {
        return onSnapshot(doc(db, "users", userId), (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            }
        });
    },

    // =============================================
    // QUIZLAB — New methods
    // =============================================

    /**
     * Save a quiz to Firestore
     * @param {string} userId - The user's UID
     * @param {object} quizData - { class, subject, chapter, difficulty, type, questions }
     * @returns {string} The quiz document ID
     */
    saveQuiz: async (userId, quizData) => {
        const quizzesRef = collection(db, "quizzes");
        const docRef = await addDoc(quizzesRef, {
            ownerId: userId,
            class: quizData.class || '',
            subject: quizData.subject || '',
            chapter: quizData.chapter || '',
            difficulty: quizData.difficulty || '',
            type: quizData.type || '',
            questions: quizData.questions || [],
            score: quizData.score || null,
            totalQuestions: quizData.questions ? quizData.questions.length : 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    /**
     * Get today's quiz generation count for rate limiting
     * Uses document ID format: userId_YYYY-MM-DD
     * @param {string} userId
     * @returns {number} count of quizzes generated today
     */
    getQuizUsageToday: async (userId) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const usageDocId = `${userId}_${today}`;
        const usageRef = doc(db, "quizUsage", usageDocId);
        const usageSnap = await getDoc(usageRef);

        if (usageSnap.exists()) {
            return usageSnap.data().count || 0;
        }
        return 0;
    },

    /**
     * Increment today's quiz usage counter
     * @param {string} userId
     */
    incrementQuizUsage: async (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const usageDocId = `${userId}_${today}`;
        const usageRef = doc(db, "quizUsage", usageDocId);
        const usageSnap = await getDoc(usageRef);

        if (usageSnap.exists()) {
            await updateDoc(usageRef, {
                count: increment(1),
                lastUsed: serverTimestamp()
            });
        } else {
            await setDoc(usageRef, {
                userId: userId,
                date: today,
                count: 1,
                lastUsed: serverTimestamp()
            });
        }
    },

    /**
     * Get user's quiz history (most recent first)
     */
    getUserQuizzes: async (userId, maxResults = 20) => {
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, where("ownerId", "==", userId));
        const snapshot = await getDocs(q);
        const quizzes = [];
        snapshot.forEach((d) => { quizzes.push({ id: d.id, ...d.data() }); });
        quizzes.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        return quizzes.slice(0, maxResults);
    },

    // =============================================
    // QUIZ RESULTS — Performance tracking
    // =============================================

    /**
     * Save a quiz result (separate doc per attempt)
     */
    saveQuizResult: async (userId, resultData) => {
        const resultsRef = collection(db, "quizResults");
        const docRef = await addDoc(resultsRef, {
            ownerId: userId,
            quizId: resultData.quizId || null,
            score: resultData.score || 0,
            total: resultData.total || 0,
            correct: resultData.correct || 0,
            wrong: resultData.wrong || 0,
            timeElapsed: resultData.timeElapsed || 0,
            subject: resultData.subject || '',
            chapter: resultData.chapter || '',
            difficulty: resultData.difficulty || '',
            type: resultData.type || '',
            completedAt: serverTimestamp()
        });
        return docRef.id;
    },

    /**
     * Get performance analytics — aggregated by subject/chapter
     */
    getQuizPerformance: async (userId, maxResults = 50) => {
        const resultsRef = collection(db, "quizResults");
        const q = query(resultsRef, where("ownerId", "==", userId));
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach((d) => { results.push({ id: d.id, ...d.data() }); });

        results.sort((a, b) => (b.completedAt?.toMillis?.() || 0) - (a.completedAt?.toMillis?.() || 0));
        const limited = results.slice(0, maxResults);

        if (limited.length === 0) {
            return { overview: null, chapters: [], improvements: [], suggestions: [] };
        }

        // --- Overview ---
        let totalScore = 0, totalTime = 0, bestScore = 0;
        limited.forEach(r => {
            totalScore += r.score || 0;
            totalTime += r.timeElapsed || 0;
            if ((r.score || 0) > bestScore) bestScore = r.score;
        });
        const avgScore = Math.round(totalScore / limited.length);

        // Trend: last 5 vs previous 5
        const last5 = limited.slice(0, 5);
        const prev5 = limited.slice(5, 10);
        const last5Avg = last5.reduce((s, r) => s + (r.score || 0), 0) / last5.length;
        const prev5Avg = prev5.length >= 3 ? prev5.reduce((s, r) => s + (r.score || 0), 0) / prev5.length : last5Avg;
        let trend = 'steady';
        if (prev5.length >= 3) {
            if (last5Avg > prev5Avg + 5) trend = 'improving';
            else if (last5Avg < prev5Avg - 5) trend = 'declining';
        }

        const overview = {
            totalQuizzes: limited.length,
            avgScore, bestScore, totalTime, trend,
            last5Scores: last5.map(r => r.score || 0)
        };

        // --- Chapter breakdown ---
        const chapterMap = {};
        limited.forEach(r => {
            const key = `${r.subject || 'General'}|||${r.chapter || 'Uncategorized'}`;
            if (!chapterMap[key]) {
                chapterMap[key] = { subject: r.subject || 'General', chapter: r.chapter || 'Uncategorized', scores: [], times: [] };
            }
            chapterMap[key].scores.push(r.score || 0);
            chapterMap[key].times.push(r.timeElapsed || 0);
        });

        const chapters = Object.values(chapterMap).map(ch => {
            const avg = Math.round(ch.scores.reduce((a, b) => a + b, 0) / ch.scores.length);
            const lastScore = ch.scores[0];
            return {
                subject: ch.subject, chapter: ch.chapter,
                avgScore: avg, lastScore,
                attempts: ch.scores.length,
                totalTime: ch.times.reduce((a, b) => a + b, 0),
                improvementScore: lastScore - avg
            };
        });
        chapters.sort((a, b) => a.avgScore - b.avgScore);

        // --- Areas to improve ---
        const improvements = chapters
            .filter(ch => ch.avgScore < 60 || (ch.lastScore < ch.avgScore && ch.avgScore < 75))
            .slice(0, 3)
            .map(ch => ({
                ...ch,
                status: ch.lastScore < ch.avgScore ? 'declining' : (ch.avgScore < 60 ? 'weak' : 'needs-practice')
            }));

        // --- Smart suggestions (rule-based) ---
        const suggestions = [];
        improvements.forEach(ch => {
            if (ch.status === 'declining') {
                suggestions.push({
                    type: 'warning', subject: ch.subject, chapter: ch.chapter,
                    message: `Declining in ${ch.chapter} — revise theory and attempt 5 MCQs daily.`
                });
            } else if (ch.status === 'weak') {
                suggestions.push({
                    type: 'alert', subject: ch.subject, chapter: ch.chapter,
                    message: `Low score in ${ch.chapter} (${ch.avgScore}%) — focus on fundamentals.`
                });
            }
        });
        // Positive feedback
        chapters.filter(ch => ch.avgScore >= 75 && ch.lastScore > ch.avgScore && ch.attempts >= 2)
            .slice(0, 2).forEach(ch => {
                suggestions.push({
                    type: 'success', subject: ch.subject, chapter: ch.chapter,
                    message: `Great progress in ${ch.chapter}! Keep practicing.`
                });
            });

        return { overview, chapters, improvements, suggestions };
    }
};

