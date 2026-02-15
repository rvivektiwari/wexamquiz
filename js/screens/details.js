import { DictionaryService } from '../services/api.js';
import { DBService } from '../services/db.js';
import { escapeHtml } from '../utils/sanitize.js';

export class DetailsScreen {
    constructor(containerId, user, onBack) {
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onBack = onBack;
        this.currentWord = null;
        this.isSaved = false;
    }

    async loadWord(word) {
        this.currentWord = word;
        this.renderSkeleton(); // Show Skeleton immediately

        try {
            // 1. Kick off all requests in parallel
            const defPromise = DictionaryService.fetchDefinition(word);
            const transPromise = DictionaryService.fetchTranslation(word);
            const savedPromise = this.user ? DBService.isWordSaved(this.user.uid, word) : Promise.resolve(false);
            const thesPromise = DictionaryService.fetchThesaurus(word); // Slowest, let it run in background

            // 2. Await Critical Data (Blocking)
            const [defData, translation, isSaved] = await Promise.all([
                defPromise,
                transPromise,
                savedPromise
            ]);

            if (!defData) {
                this.renderError(word);
                return;
            }

            // 3. Render Main Content Immediately
            this.isSaved = isSaved;
            this.render(defData, translation);

            // Save search history
            if (this.user) DBService.addToHistory(this.user.uid, word);

            // 4. Await Non-Critical Data (Thesaurus) & Update UI
            try {
                const thesaurus = await thesPromise;
                this.renderThesaurus(thesaurus);
            } catch (err) {
                this.renderThesaurus({ synonyms: [], antonyms: [] });
            }

        } catch (error) {
            this.renderError(word);
        }
    }

    renderSkeleton() {
        this.container.innerHTML = `
            <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                <div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button id="back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    <button class="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 cursor-not-allowed">
                        <span class="material-icons-round">bookmark_border</span>
                    </button>
                </div>
            </header>

            <main class="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
                <div class="flex flex-col items-center text-center gap-4 py-8">
                    <div class="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    <div class="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                </div>
                
                <div class="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full"></div>
                <div class="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full"></div>
                <div class="h-40 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full"></div>
            </main>
        `;
        document.getElementById('back-btn').addEventListener('click', this.onBack);
    }

    render(data, translation) {
        const { word, phonetics, meanings } = data;
        const phoneticText = phonetics.find(p => p.text)?.text || '';
        const audioUrl = phonetics.find(p => p.audio)?.audio || '';

        // Save Button Icon
        const saveIcon = this.isSaved ? 'bookmark' : 'bookmark_border';
        const saveColor = this.isSaved ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400';
        const saveBg = this.isSaved ? 'bg-brand-50 dark:bg-brand-900/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800';

        this.container.innerHTML = `
             <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
                <div class="mesh-gradient-1 fixed top-0 left-0 w-full h-full pointer-events-none z-0"></div>
                
                <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                    <div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                        <button id="back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                            <span class="material-icons-round">arrow_back</span>
                        </button>
                        <button id="save-word-btn" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${saveBg} ${saveColor}" aria-label="${this.isSaved ? 'Unsave word' : 'Save word'}">
                            <span class="material-icons-round">${saveIcon}</span>
                        </button>
                    </div>
                </header>

                <main class="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6 md:gap-8 fade-in">
                    
                    <!-- Hero -->
                    <section class="flex flex-col items-center text-center">
                        <div class="flex items-center gap-3 flex-wrap justify-center">
                            <h1 class="text-3xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white break-words max-w-full">${escapeHtml(word)}</h1>
                            ${audioUrl ? `
                                <button class="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95" onclick="new Audio('${audioUrl}').play()" aria-label="Play pronunciation">
                                    <span class="material-icons-round text-2xl">volume_up</span>
                                </button>
                            ` : ''}
                        </div>
                        ${phoneticText ? `<p class="mt-4 text-xl font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full">${phoneticText}</p>` : ''}
                    </section>

                    <!-- Translation -->
                    ${translation ? `
                    <section class="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-3xl p-6 shadow-sm">
                        <div class="flex items-center gap-2 mb-3 text-violet-700 dark:text-violet-300 text-sm font-bold uppercase tracking-wider">
                            <span class="material-icons-round text-lg">translate</span>
                            <span>Translation</span>
                        </div>
                        <p class="text-2xl font-serif font-medium text-gray-900 dark:text-white">${escapeHtml(translation)}</p>
                    </section>
                    ` : ''}

                    <!-- Meanings -->
                    <div class="space-y-6">
                        ${meanings.map((m, index) => `
                            <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm">
                                <div class="inline-block px-3 py-1 mb-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                    ${m.partOfSpeech}
                                </div>
                                <ul class="space-y-6">
                                    ${m.definitions.map(d => `
                                        <li class="group">
                                            <div class="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">${escapeHtml(d.definition)}</div>
                                            ${d.example ? `<div class="mt-2 pl-4 border-l-2 border-brand-200 dark:border-brand-900 text-gray-500 dark:text-gray-400 italic">"${escapeHtml(d.example)}"</div>` : ''}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Thesaurus Container -->
                    <div id="thesaurus-container">
                        <div class="h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full animate-pulse"></div>
                    </div>
                </main>
                <div id="toast" class="toast hidden"></div>
            </div>
        `;

        this.addEventListeners(data);
    }

    renderThesaurus(data) {
        const container = document.getElementById('thesaurus-container');
        if (!container) return;

        const hasSynonyms = data.synonyms && data.synonyms.length > 0;
        const hasAntonyms = data.antonyms && data.antonyms.length > 0;

        if (!hasSynonyms && !hasAntonyms) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        if (hasSynonyms) {
            html += `
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm mb-6 fade-in">
                <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Synonyms</h3>
                <div class="flex flex-wrap gap-2">
                    ${data.synonyms.map(s => `
                        <button class="chip-premium px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors" data-word="${escapeHtml(s)}">
                            ${escapeHtml(s)}
                        </button>`).join('')}
                </div>
            </section>`;
        }

        if (hasAntonyms) {
            html += `
            <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm fade-in">
                <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Antonyms</h3>
                <div class="flex flex-wrap gap-2">
                    ${data.antonyms.map(s => `
                        <button class="chip-premium px-4 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium transition-colors" data-word="${escapeHtml(s)}">
                            ${escapeHtml(s)}
                        </button>`).join('')}
                </div>
            </section>`;
        }

        container.innerHTML = html;

        // Re-attach listeners for new chips
        container.querySelectorAll('.chip-premium').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const word = e.target.dataset.word;
                if (word) this.loadWord(word.trim());
            });
        });
    }

    addEventListeners(data) {
        document.getElementById('back-btn').addEventListener('click', this.onBack);

        // Save Toggle Logic
        const saveBtn = document.getElementById('save-word-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.disabled = true;

                try {
                    if (this.isSaved) {
                        await DBService.removeWord(this.user.uid, data.word);
                        this.isSaved = false;
                        this.showToast('Word removed from saved list');
                    } else {
                        await DBService.saveWord(this.user.uid, {
                            word: data.word,
                            definition: data.meanings[0]?.definitions[0]?.definition || '',
                            phonetic: data.phonetics[0]?.text || '',
                            timestamp: new Date().toISOString()
                        });
                        this.isSaved = true;
                        this.showToast('Word saved successfully!');
                    }

                    const icon = saveBtn.querySelector('.material-icons-round');
                    icon.textContent = this.isSaved ? 'bookmark' : 'bookmark_border';
                    saveBtn.classList.toggle('active', this.isSaved);

                } catch (e) {
                    this.showToast('Error updating saved word', 'error');
                } finally {
                    saveBtn.disabled = false;
                }
            });
        }
    }

    renderError(word) {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 flex flex-col">
                <div class="mesh-gradient-1 fixed top-0 left-0 w-full h-full pointer-events-none z-0"></div>
                <div class="mesh-gradient-2 fixed top-0 right-0 w-full h-full pointer-events-none z-0"></div>

                <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                    <div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                        <button id="back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                            <span class="material-icons-round">arrow_back</span>
                        </button>
                    </div>
                </header>

                <main class="relative z-10 flex-grow flex flex-col items-center justify-center p-6 text-center fade-in">
                    <div class="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                        <span class="material-icons-round text-5xl text-red-500 dark:text-red-400">search_off</span>
                    </div>
                    
                    <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        No results found
                    </h2>
                    
                    <p class="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
                        We couldn't find any definitions for <span class="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">"${escapeHtml(word)}"</span>.
                    </p>

                    <button id="try-again-btn" class="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all">
                        Search Again
                    </button>
                </main>
            </div>
        `;

        const backBtn = document.getElementById('back-btn');
        const tryAgainBtn = document.getElementById('try-again-btn');

        if (backBtn) backBtn.addEventListener('click', this.onBack);
        if (tryAgainBtn) tryAgainBtn.addEventListener('click', this.onBack);
    }

    showToast(message, type = 'success') {
        const toast = this.container.querySelector('#toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = 'toast hidden';
        }, 3000);
    }

    destroy() {
        // No persistent subscriptions to clean up in this screen
    }
}
