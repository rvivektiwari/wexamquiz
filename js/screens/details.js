import { DictionaryService } from '../services/api.js';
import { DBService } from '../services/db.js';
import { escapeHtml } from '../utils/sanitize.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class DetailsScreen {
    constructor(containerId, user, onBack) {
        this.containerId = containerId;
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
        const skeletonContent = `
            <div class="flex items-center justify-between mb-8">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            </div>
            
            <div class="flex flex-col items-center text-center gap-4 py-8">
                <div class="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                <div class="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
            
            <div class="flex flex-col gap-6">
                <div class="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full animate-pulse"></div>
                <div class="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full animate-pulse"></div>
                <div class="h-40 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full animate-pulse"></div>
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: () => { } });
        this.container.innerHTML = layout.render(skeletonContent);
        // postRender not strictly needed for skeleton mostly
    }

    render(data, translation) {
        const { word, phonetics, meanings } = data;
        const phoneticText = phonetics.find(p => p.text)?.text || '';
        const audioUrl = phonetics.find(p => p.audio)?.audio || '';

        // Save Button Icon
        const saveIcon = this.isSaved ? 'bookmark' : 'bookmark_border';
        const saveColor = this.isSaved ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400';
        const saveBg = this.isSaved ? 'bg-brand-50 dark:bg-brand-900/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800';

        const topBar = `
            <div class="flex items-center justify-between mb-6">
                <button id="back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                    <span class="material-icons-round">arrow_back</span>
                </button>
                <button id="save-word-btn" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${saveBg} ${saveColor}" aria-label="${this.isSaved ? 'Unsave word' : 'Save word'}">
                    <span class="material-icons-round">${saveIcon}</span>
                </button>
            </div>
        `;

        const hero = `
            <section class="flex flex-col items-center text-center py-4 mb-4">
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
        `;

        const translationContent = translation ? `
            <div class="flex items-center gap-2 mb-3 text-violet-700 dark:text-violet-300 text-sm font-bold uppercase tracking-wider">
                <span class="material-icons-round text-lg">translate</span>
                <span>Translation</span>
            </div>
            <p class="text-2xl font-serif font-medium text-gray-900 dark:text-white">${escapeHtml(translation)}</p>
        ` : '';

        const meaningsContent = meanings.map((m) => `
            <div class="mb-2">
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
        `).join(''); // We will wrap each meaning in a Card? Or all in one? The original had separated cards.

        // Let's create an array of Cards for meanings
        const meaningCards = meanings.map(m => {
            const content = `
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
            `;
            return Card(content);
        }).join('');


        // Assemble final HTML
        const finalHtml = `
            <div class="max-w-3xl mx-auto flex flex-col gap-6">
                ${topBar}
                ${hero}
                ${translation ? Card(translationContent, "border-violet-100 dark:border-violet-800/30 bg-violet-50/50 dark:bg-violet-900/10") : ''}
                ${meaningCards}
                <div id="thesaurus-container">
                    <div class="h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl w-full animate-pulse"></div>
                </div>
            </div>
             <div id="toast" class="toast hidden"></div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: () => { } });
        this.container.innerHTML = layout.render(finalHtml);
        layout.postRender();
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
            const content = `
                <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Synonyms</h3>
                <div class="flex flex-wrap gap-2">
                    ${data.synonyms.map(s => `
                        <button class="chip-premium px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors" data-word="${escapeHtml(s)}">
                            ${escapeHtml(s)}
                        </button>`).join('')}
                </div>
            `;
            html += Card(content, "mb-6");
        }

        if (hasAntonyms) {
            const content = `
                <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Antonyms</h3>
                <div class="flex flex-wrap gap-2">
                    ${data.antonyms.map(s => `
                        <button class="chip-premium px-4 py-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium transition-colors" data-word="${escapeHtml(s)}">
                            ${escapeHtml(s)}
                        </button>`).join('')}
                </div>
            `;
            html += Card(content);
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
        // Back Button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.addEventListener('click', this.onBack);

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

                    // Update classes for visual feedback
                    if (this.isSaved) {
                        saveBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
                        saveBtn.classList.add('text-brand-600', 'dark:text-brand-400', 'bg-brand-50', 'dark:bg-brand-900/10');
                    } else {
                        saveBtn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
                        saveBtn.classList.remove('text-brand-600', 'dark:text-brand-400', 'bg-brand-50', 'dark:bg-brand-900/10');
                    }

                } catch (e) {
                    this.showToast('Error updating saved word', 'error');
                } finally {
                    saveBtn.disabled = false;
                }
            });
        }
    }

    renderError(word) {
        const content = `
             <div class="flex flex-col items-center justify-center p-6 text-center">
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
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: () => { } });

        // Error content wrapped in a Card looks better? Or just raw?
        // The original had it raw on the background.
        // Let's wrap it in a large transparency card.
        // Actually, just passing it to layout is fine, but we need the "back" button somewhere.
        // The error screen had a header with back button.
        // I'll add a back button to the content or rely on browser back?
        // DetailsScreen error usually lets you "Search Again" which calls onBack.

        const finalHtml = `
            <div class="max-w-3xl mx-auto mt-10">
                 ${Card(content)}
            </div>
        `;

        this.container.innerHTML = layout.render(finalHtml);
        layout.postRender();

        const tryAgainBtn = document.getElementById('try-again-btn');
        if (tryAgainBtn) tryAgainBtn.addEventListener('click', this.onBack);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = 'toast hidden';
        }, 3000);
    }

    destroy() {
        // No persistent subscriptions
    }
}
