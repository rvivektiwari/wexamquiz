import { db, collection, query, orderBy, onSnapshot } from '../config/firebase-config.js';
import { DBService } from '../services/db.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class SavedScreen {
    constructor(containerId, user, onBack, onWordClick) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onBack = onBack;
        this.onWordClick = onWordClick;
        this.words = []; // Store words locally for filtering
        this.unsubscribe = null;
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
        const skeletonContent = `
            <div class="w-full h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse mb-8 max-w-md mx-auto"></div>
            <div id="saved-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Array(6).fill(0).map(() => `
                    <div class="h-40 bg-gray-100 dark:bg-gray-900 rounded-3xl animate-pulse"></div>
                `).join('')}
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: () => { } });
        this.container.innerHTML = layout.render(skeletonContent);
        // We don't call postRender here because we are waiting for data
    }

    renderList(words) {
        // Construct the full inner HTML with search bar and grid
        const searchContent = `
            <div class="relative w-full max-w-md mx-auto mb-8 group">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-icons-round text-gray-400 group-focus-within:text-brand-500 transition-colors">search</span>
                </span>
                <input type="text" id="saved-search" 
                    class="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                    placeholder="Search your collection..." aria-label="Search saved words">
            </div>
        `;

        const gridContent = `
            <div id="saved-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Grid items will be injected here if I strictly separated them, 
                     but Layout.render replaces everything. 
                     So I should generate the grid HTML here. -->
                ${this.getGridItemsHTML(words)}
            </div>
        `;

        const finalHtml = `
            <div class="max-w-5xl mx-auto flex flex-col gap-6">
                 <div class="flex items-center gap-4 mb-2">
                    <button id="saved-back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Saved Words</h1>
                </div>
                ${searchContent}
                ${gridContent}
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: () => { } });
        this.container.innerHTML = layout.render(finalHtml);
        layout.postRender();

        this.addEventListeners();
    }

    getGridItemsHTML(words) {
        if (words.length === 0) {
            return `
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
        }

        return words.map(w => {
            const inner = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">${w.word}</h3>
                    <span class="material-icons-round text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors transform group-hover:scale-110">arrow_forward</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">${w.definition}</p>
                ${w.phonetic ? `<div class="mt-4 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-500 dark:text-gray-400">${w.phonetic}</div>` : ''}
            `;
            // Using Card with extra classes for hover effects
            return `
                <div class="saved-card cursor-pointer group h-full" data-word="${w.word}">
                    ${Card(inner, "hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full")}
                </div>
            `;
        }).join('');
    }

    addEventListeners() {
        const backBtn = document.getElementById('saved-back-btn');
        if (backBtn) backBtn.addEventListener('click', this.onBack);

        const searchInput = document.getElementById('saved-search');
        if (searchInput) {
            // Restore focus and value if re-rendering? 
            // Currently I re-render the WHOLE page on snapshot updates.
            // But search filtering is local. I shouldn't re-render whole layout on search input.
            // I should only update the grid container.

            searchInput.focus(); // Simple hack, might not be enough if typing fast

            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = this.words.filter(w =>
                    w.word.toLowerCase().includes(term) ||
                    w.definition.toLowerCase().includes(term)
                );
                // Just update the grid
                const grid = document.getElementById('saved-grid');
                if (grid) {
                    grid.innerHTML = this.getGridItemsHTML(filtered);
                    this.attachCardListeners(grid);
                }
            });
        }

        const grid = document.getElementById('saved-grid');
        if (grid) this.attachCardListeners(grid);
    }

    attachCardListeners(grid) {
        grid.querySelectorAll('.saved-card').forEach(card => {
            card.addEventListener('click', () => {
                this.onWordClick(card.dataset.word);
            });
        });
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
