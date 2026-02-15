import { AuthService } from '../services/auth.js';
import { API } from '../services/api.js';
import { toast } from '../utils/toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class HomeScreen {
    constructor(containerId, navigateToDetails, navigateToSaved, navigateToProfile, onNavigateStatic) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.navigateToDetails = navigateToDetails;
        this.navigateToSaved = navigateToSaved;
        this.navigateToProfile = navigateToProfile;
        this.onNavigateStatic = onNavigateStatic;

        // State
        this.isLoading = true;
        this.dashboardData = null;
    }

    async render(user) {
        this.user = user;
        try {
            this.dashboardData = await API.getDashboardData(this.user);
            this.isLoading = false;
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            this.isLoading = false;
            toast.show("Could not load dashboard data.", "error");
        }
        this.renderScreen();
    }

    renderScreen() {
        const { userName, wordOfTheDay, wordsLearned, trending } = this.dashboardData || {
            userName: this.user?.displayName?.split(' ')[0] || 'Learner',
            wordsLearned: 0,
            wordOfTheDay: null,
            trending: []
        };

        const contentHtml = `
            <div class="flex flex-col gap-10">
                <!-- 🔍 HERO SEARCH SECTION -->
                <section class="w-full relative group z-30">
                     <div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                     <div class="relative w-full bg-white/50 dark:bg-gray-900/40 backdrop-blur-md border border-white/50 dark:border-gray-700/50 rounded-[1.8rem] p-6 md:p-12 flex flex-col gap-6 items-center text-center shadow-lg">
                        
                        <h1 class="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                            What word are you looking for?
                        </h1>

                        <!-- Search Input -->
                        <div class="relative w-full max-w-2xl group/input z-40">
                            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <span class="material-icons-round text-gray-400 text-2xl group-focus-within/input:text-brand-600 dark:group-focus-within/input:text-brand-400 transition-colors">search</span>
                            </div>
                            <input type="text" id="hero-search" 
                                class="w-full h-14 pl-12 pr-12 bg-white dark:bg-gray-950 rounded-xl text-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-lg transition-all"
                                placeholder="Search for any word..." autocomplete="off">
                            
                            <!-- Keyboard Hint -->
                            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <div class="hidden md:flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <span class="text-xs font-bold text-gray-500 font-sans">⌘K</span>
                                </div>
                            </div>

                            <!-- Suggestions Dropdown -->
                            <div id="search-suggestions" class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform origin-top transition-all duration-200 scale-95 opacity-0 invisible text-left">
                                <!-- Suggestions will be injected here -->
                            </div>
                        </div>
                     </div>
                </section>

                <!-- 🧱 BENTO GRID -->
                <section class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                    
                    <!-- Card 1: Word of the Day -->
                    <div class="group relative bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-800 hover:border-blue-500/50" id="card-wotd">
                         ${wordOfTheDay ? `
                            <div class="flex flex-col h-full justify-between">
                                <div>
                                    <div class="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-4">
                                        Word of the Day
                                    </div>
                                    <h3 class="text-2xl font-serif font-medium text-gray-900 dark:text-white mb-1">
                                        ${escapeHtml(wordOfTheDay.word)}
                                    </h3>
                                    <p class="text-gray-500 dark:text-gray-400 font-serif italic mb-3 text-sm">
                                        ${wordOfTheDay.pronunciation || ''}
                                    </p>
                                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 text-sm">
                                        ${escapeHtml(wordOfTheDay.definition)}
                                    </p>
                                </div>
                                <div class="mt-4 flex items-center text-brand-600 dark:text-brand-400 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                                    Learn more <span class="material-icons-round text-base ml-1">arrow_forward</span>
                                </div>
                            </div>
                         ` : `
                            <div class="animate-pulse flex flex-col h-full">
                                 <div class="w-20 h-5 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
                                 <div class="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3"></div>
                                 <div class="w-full h-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                            </div>
                         `}
                    </div>

                    <!-- Card 2: User Stats -->
                    <div class="bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-violet-500/50">
                        <div class="flex flex-col h-full">
                            <span class="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Your Progress</span>
                            
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Level ${Math.floor(wordsLearned / 10) + 1}</h3>
                                <span class="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                    ${wordsLearned < 10 ? 'Novice' : wordsLearned < 50 ? 'Scholar' : 'Linguist'}
                                </span>
                            </div>

                            <div class="flex-1 flex flex-col justify-center items-center text-center py-2">
                                <span class="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-violet-500 to-fuchsia-500 font-display transition-all hover:scale-110 duration-300 cursor-default">
                                    ${wordsLearned}
                                </span>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Total Words</span>
                            </div>

                            <div class="space-y-1.5 mt-2">
                                <div class="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                    <span>Current Level</span>
                                    <span>${wordsLearned % 10} / 10 to Next</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <div class="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 ease-out" style="width: ${(wordsLearned % 10) * 10}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card 3: Trending -->
                    <div class="bg-white/60 dark:bg-gray-900/60 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-pink-500/50">
                        <span class="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 block">Trending Now</span>
                        <div class="flex flex-col gap-2">
                            ${trending && trending.length > 0 ? trending.map(item => `
                                <div class="group/item flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer" data-word="${item.word}">
                                    <div>
                                        <span class="block text-gray-900 dark:text-white font-semibold text-sm group-hover/item:text-brand-600 transition-colors">${escapeHtml(item.word)}</span>
                                        <span class="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">${escapeHtml(item.definition)}</span>
                                    </div>
                                    <span class="material-icons-round text-gray-300 group-hover/item:text-brand-500 text-base">chevron_right</span>
                                </div>
                            `).join('') : `
                                <div class="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                                <div class="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                                <div class="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            `}
                        </div>
                    </div>

                </section>
            </div>
        `;

        // Instantiate Layout
        const layout = new Layout(this.containerId, this.user, {
            onNavigate: (route) => {
                if (route === 'home') return; // Already here
                if (route === 'profile') this.navigateToProfile();
                else if (route === 'saved') this.navigateToSaved();
                else if (this.onNavigateStatic) this.onNavigateStatic(route);
            },
            onLogout: () => AuthService.logout()
        });

        // Providing "Card" wrapper around the ENTIRE content as requested
        const wrappedContent = Card(contentHtml, "flex flex-col gap-8");

        this.container.innerHTML = layout.render(wrappedContent);
        layout.postRender();
        this.addEventListeners();
    }

    addEventListeners() {
        // Autocomplete Logic
        const searchInput = document.getElementById('hero-search');
        const suggestionsBox = document.getElementById('search-suggestions');
        let debounceTimer;

        if (searchInput && suggestionsBox) {
            // Input Handler
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(debounceTimer);

                if (query.length < 2) {
                    this.hideSuggestions(suggestionsBox);
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    const suggestions = await API.fetchSuggestions(query);
                    this.renderSuggestions(suggestions, query, suggestionsBox, searchInput);
                }, 300);
            });

            // Focus Handler
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length >= 2 && suggestionsBox.innerHTML !== '') {
                    this.showSuggestions(suggestionsBox);
                }
            });

            // Blur/Click Outside Handler
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                    this.hideSuggestions(suggestionsBox);
                }
            });

            // Keyboard Nav
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (searchInput.value.trim()) {
                        this.navigateToDetails(searchInput.value.trim());
                        this.hideSuggestions(suggestionsBox);
                    }
                }
            });

            // ⌘K Shortcut
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        }

        // Click handlers for cards
        const wotdCard = document.getElementById('card-wotd');
        if (wotdCard && this.dashboardData?.wordOfTheDay?.word) {
            wotdCard.addEventListener('click', () => {
                this.navigateToDetails(this.dashboardData.wordOfTheDay.word);
            });
        }

        // Trending clicks
        document.querySelectorAll('[data-word]').forEach(el => {
            el.addEventListener('click', (e) => {
                const word = e.currentTarget.dataset.word;
                if (word) this.navigateToDetails(word);
            });
        });
    }

    renderSuggestions(suggestions, query, container, input) {
        if (!suggestions || suggestions.length === 0) {
            this.hideSuggestions(container);
            return;
        }

        container.innerHTML = suggestions.map(word => {
            const safeWord = word.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group suggestion-item" data-word="${safeWord}">
                <span class="text-gray-700 dark:text-gray-200 font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    ${this.highlightMatch(safeWord, query)}
                </span>
                <span class="material-icons-round text-gray-300 group-hover:text-brand-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    north_west
                </span>
            </button>
        `}).join('');

        // Add Click Handlers
        container.querySelectorAll('.suggestion-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const word = btn.dataset.word;
                input.value = word;
                this.navigateToDetails(word);
                this.hideSuggestions(container);
            });
        });

        this.showSuggestions(container);
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="text-brand-600 dark:text-brand-400 font-bold">$1</span>');
    }

    showSuggestions(container) {
        container.classList.remove('opacity-0', 'invisible', 'scale-95');
        container.classList.add('opacity-100', 'visible', 'scale-100');
    }

    hideSuggestions(container) {
        container.classList.add('opacity-0', 'invisible', 'scale-95');
        container.classList.remove('opacity-100', 'visible', 'scale-100');
    }
}
