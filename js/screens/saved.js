import { db, collection, query, orderBy, onSnapshot } from '../config/firebase-config.js';
import { DBService } from '../services/db.js';

export class SavedScreen {
    constructor(containerId, user, onBack, onWordClick) {
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onBack = onBack;
        this.onWordClick = onWordClick;
        this.words = []; // Store words locally for filtering
    }

    render() {
        if (!this.user) {
            this.container.innerHTML = `<div class="p-8 text-center text-gray-500">Please log in to view saved words.</div>`;
            return;
        }
        this.renderSkeleton();

        // Subscribe to real-time updates
        const q = query(collection(db, "users", this.user.uid, "savedWords"));

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            this.words = [];
            snapshot.forEach((doc) => {
                this.words.push(doc.data());
            });

            // Client-side sort by timestamp descending
            this.words.sort((a, b) => {
                const dateA = new Date(a.savedAt || 0);
                const dateB = new Date(b.savedAt || 0);
                return dateB - dateA;
            });

            this.renderList(this.words);
        }, (error) => {
            console.error("Error fetching saved words:", error);
            const list = document.getElementById('saved-grid');
            if (list) list.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-red-500">Error loading saved words. Please try again.</p>
                </div>`;
        });
    }

    renderSkeleton() {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
                 <!-- Background Atmosphere -->
                <div class="mesh-gradient-1 fixed top-0 left-0 w-full h-full pointer-events-none z-0"></div>
                <div class="mesh-gradient-2 fixed top-0 right-0 w-full h-full pointer-events-none z-0"></div>

                <!-- Header -->
                <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button id="saved-back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                                <span class="material-icons-round">arrow_back</span>
                            </button>
                            <h1 class="text-lg font-bold text-gray-900 dark:text-white">Saved Words</h1>
                        </div>
                    </div>
                </header>

                <main class="relative z-10 max-w-5xl mx-auto px-6 py-8 fade-in flex flex-col gap-6">
                    <!-- Search Bar Skeleton -->
                    <div class="w-full h-12 bg-white/50 dark:bg-gray-900/50 rounded-2xl animate-pulse"></div>

                    <!-- Grid Skeleton -->
                    <div id="saved-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${Array(6).fill(0).map(() => `
                            <div class="h-40 bg-white/50 dark:bg-gray-900/50 rounded-3xl animate-pulse"></div>
                        `).join('')}
                    </div>
                </main>
            </div>
        `;

        const backBtn = document.getElementById('saved-back-btn');
        if (backBtn) backBtn.addEventListener('click', this.onBack);
    }

    renderList(words) {
        const grid = document.getElementById('saved-grid');
        // If we are re-rendering the list (e.g. after search), we need to make sure the container exists
        // If the user navigated away, container might be null
        if (!grid) return;

        // Re-render the search bar container if needed (only once)
        const main = this.container.querySelector('main');
        if (!document.getElementById('saved-search')) {
            main.innerHTML = `
                <!-- Search Bar -->
                <div class="relative w-full max-w-md mx-auto mb-8 group">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span class="material-icons-round text-gray-400 group-focus-within:text-brand-500 transition-colors">search</span>
                    </span>
                    <input type="text" id="saved-search" 
                        class="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                        placeholder="Search your collection..." aria-label="Search saved words">
                </div>
                
                <div id="saved-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            `;

            // Re-select grid
            const newGrid = document.getElementById('saved-grid');
            this.setupSearch(newGrid);
            this.renderGridItems(newGrid, words);
        } else {
            this.renderGridItems(grid, words);
        }
    }

    renderGridItems(container, words) {
        if (words.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-center fade-in">
                    <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <span class="material-icons-round text-4xl text-gray-400">bookmarks</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No words found</h3>
                    <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Your collection is empty. Start exploring and save new words to build your vocabulary!
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = words.map(w => `
            <div class="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer saved-card" data-word="${w.word}">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">${w.word}</h3>
                    <span class="material-icons-round text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors transform group-hover:scale-110">arrow_forward</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">${w.definition}</p>
                ${w.phonetic ? `<div class="mt-4 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-500 dark:text-gray-400">${w.phonetic}</div>` : ''}
            </div>
        `).join('');

        container.querySelectorAll('.saved-card').forEach(card => {
            card.addEventListener('click', () => {
                this.onWordClick(card.dataset.word);
            });
        });
    }

    setupSearch(gridContainer) {
        const searchInput = document.getElementById('saved-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filtered = this.words.filter(w =>
                w.word.toLowerCase().includes(term) ||
                w.definition.toLowerCase().includes(term)
            );
            this.renderGridItems(gridContainer, filtered);
        });
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
