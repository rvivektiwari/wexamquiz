const admin = require('../lib/firebase-admin');
const pdfParse = require('pdf-parse');

const MAX_TEXT_LENGTH = 15000;

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
        try {
            await admin.auth().verifyIdToken(idToken);
        } catch (authError) {
            console.error('Auth verification failed:', authError);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // 2. Process PDF
        const { pdfBase64 } = req.body;

        if (!pdfBase64 || typeof pdfBase64 !== 'string') {
            return res.status(400).json({ error: 'PDF data is required.' });
        }

        const sizeInBytes = (pdfBase64.length * 3) / 4;
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (sizeInBytes > maxSize) {
            return res.status(400).json({ error: 'PDF file is too large. Maximum size is 5MB.' });
        }

        const buffer = Buffer.from(pdfBase64, 'base64');
        const pdfData = await pdfParse(buffer);

        if (!pdfData || !pdfData.text || pdfData.text.trim().length < 50) {
            return res.status(400).json({
                error: 'Could not extract sufficient text from this PDF. It may be encrypted or image-based.'
            });
        }

        let cleanText = pdfData.text
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanText.length > MAX_TEXT_LENGTH) {
            cleanText = cleanText.substring(0, MAX_TEXT_LENGTH);
        }

        return res.json({
            text: cleanText,
            pages: pdfData.numpages
        });

    } catch (error) {
        console.error('PDF extraction error:', error.message);
        if (error.message && error.message.includes('encrypted')) {
            return res.status(400).json({ error: 'This PDF is encrypted and cannot be processed.' });
        }
        return res.status(500).json({ error: 'Failed to process PDF file.' });
    }
};
