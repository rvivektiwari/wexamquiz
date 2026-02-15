import { DBService } from './db.js';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const NEGATIVE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for 404s

const cache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            const record = JSON.parse(item);
            if (Date.now() > record.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return record.data;
        } catch (e) { return null; }
    },
    set: (key, data, ttl = CACHE_DURATION) => {
        try {
            const record = {
                data,
                expiry: Date.now() + ttl
            };
            localStorage.setItem(key, JSON.stringify(record));
        } catch (e) {
            // Quota exceeded — silently ignore
        }
    }
};

const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
};

/**
 * Fetch with retry and exponential backoff.
 * Retries once after a 1s delay for transient failures.
 */
const fetchWithRetry = async (url, options = {}, retries = 1) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options);
            // Don't retry client errors (4xx) except 429 (rate limit)
            if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
                return response;
            }
            // Server error (5xx) or rate limit — retry
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }
            return response;
        } catch (error) {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }
            throw error;
        }
    }
};

/**
 * Sanitize a word for use in API URLs — strips non-alphanumeric chars (except spaces/hyphens)
 * and encodes for URL safety.
 */
const sanitizeWordForUrl = (word) => {
    return encodeURIComponent(String(word).trim().toLowerCase().replace(/[^\w\s-]/g, ''));
};

export const DictionaryService = {
    // 1. DictionaryAPI (Definitions, Phonetics, Audio)
    fetchDefinition: async (word) => {
        const safeWord = sanitizeWordForUrl(word);
        const cacheKey = `dict_def_${safeWord}`;
        const cached = cache.get(cacheKey);
        if (cached === '__NOT_FOUND__') return null; // Cached 404 (short TTL)
        if (cached) return cached;

        try {
            const response = await fetchWithRetry(`https://api.dictionaryapi.dev/api/v2/entries/en/${safeWord}`);
            if (!response.ok) {
                if (response.status === 404) {
                    cache.set(cacheKey, '__NOT_FOUND__', NEGATIVE_CACHE_DURATION);
                    return null;
                }
                return null; // Non-404 error, don't cache
            }
            const data = await response.json();
            const result = data[0];
            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            // Network/timeout — don't cache, allow retry on next attempt
            return null;
        }
    },

    // 2. Datamuse API (Synonyms, Antonyms)
    fetchThesaurus: async (word) => {
        const safeWord = sanitizeWordForUrl(word);
        const cacheKey = `dict_thes_${safeWord}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const synonymsReq = fetchWithTimeout(`https://api.datamuse.com/words?rel_syn=${safeWord}&max=5`);
            const antonymsReq = fetchWithTimeout(`https://api.datamuse.com/words?rel_ant=${safeWord}&max=5`);

            const [synRes, antRes] = await Promise.all([synonymsReq, antonymsReq]);

            const synonyms = await synRes.json();
            const antonyms = await antRes.json();

            const result = {
                synonyms: synonyms.map(s => s.word),
                antonyms: antonyms.map(a => a.word)
            };
            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            return { synonyms: [], antonyms: [] };
        }
    },

    // 3. MyMemory API (English -> Hindi Translation)
    fetchTranslation: async (word) => {
        const safeWord = sanitizeWordForUrl(word);
        const cacheKey = `dict_trans_${safeWord}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetchWithTimeout(`https://api.mymemory.translated.net/get?q=${safeWord}&langpair=en|hi`);
            const data = await response.json();
            if (data.responseStatus === 200) {
                const result = data.responseData.translatedText;
                cache.set(cacheKey, result);
                return result;
            }
            return null;
        } catch (error) {
            return null;
        }
    },

    // 4. Autocomplete Suggestions (Datamuse)
    fetchSuggestions: async (query) => {
        if (!query || query.length < 2) return [];
        const safeQuery = sanitizeWordForUrl(query);
        const cacheKey = `dict_sug_${safeQuery}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetchWithTimeout(`https://api.datamuse.com/sug?s=${safeQuery}&max=5`);
            const data = await response.json();
            const suggestions = data.map(item => item.word);
            cache.set(cacheKey, suggestions);
            return suggestions;
        } catch (error) {
            return [];
        }
    },

    getDashboardData: async (user) => {
        // 1. Get/Set Word of the Day (WOTD)
        const wotdList = ['serendipity', 'ephemeral', 'petrichor', 'mellifluous', 'ineffable', 'luminous', 'sanguine', 'ethereal', 'eloquence', 'solitude'];
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const wotdIndex = dayOfYear % wotdList.length;
        const wotdWord = wotdList[wotdIndex];

        // 2. Get Trending Words
        const trendingList = ['nebula', 'zenith', 'horizon', 'azure', 'cascade', 'luminous', 'radiant', 'vibrant', 'prism', 'cosmos'];
        const start = (dayOfYear * 3) % trendingList.length;
        const trendingWords = [
            trendingList[start],
            trendingList[(start + 1) % trendingList.length],
            trendingList[(start + 2) % trendingList.length]
        ];

        try {
            const [wotdData, ...trendingData] = await Promise.all([
                DictionaryService.fetchDefinition(wotdWord),
                ...trendingWords.map(w => DictionaryService.fetchDefinition(w))
            ]);

            // User Stats
            let wordsLearned = 0;
            let userName = 'Learner';

            if (user) {
                try {
                    const profile = await DBService.getUserProfile(user.uid);
                    if (profile) {
                        wordsLearned = profile.wordsLearned || 0;
                        userName = profile.name || user.displayName || 'Learner';
                    }
                } catch (e) {
                    // Silently fallback for user profile fetch failures
                }
            }

            return {
                wordOfTheDay: {
                    word: wotdData?.word || wotdWord,
                    pronunciation: wotdData?.phonetics?.find(p => p.text)?.text || '',
                    definition: wotdData?.meanings?.[0]?.definitions?.[0]?.definition || 'Definition not found.'
                },
                trending: trendingData.map((d, i) => ({
                    word: d?.word || trendingWords[i],
                    definition: d?.meanings?.[0]?.definitions?.[0]?.definition || 'Definition not available.'
                })),
                wordsLearned,
                userName
            };

        } catch (error) {
            return {
                wordOfTheDay: { word: 'Welcome', definition: 'To greet someone.' },
                trending: [],
                wordsLearned: 0,
                userName: user?.displayName || 'Learner'
            };
        }
    }
};

export const API = DictionaryService;
