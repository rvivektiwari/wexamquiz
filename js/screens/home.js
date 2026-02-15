import { AuthService } from '../services/auth.js';
import { API } from '../services/api.js';
import { toast } from '../utils/toast.js';
import { escapeHtml } from '../utils/sanitize.js';

export class HomeScreen {
    constructor(containerId, navigateToDetails, navigateToSaved, navigateToProfile, onNavigateStatic) {
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
        this.container.innerHTML = this.getLoadingSkeleton();

        try {
            this.dashboardData = await API.getDashboardData(this.user);
            this.isLoading = false;
            this.renderContent();
            this.addEventListeners();
            this.initializeTheme();
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            this.isLoading = false;
            toast.show("Could not load dashboard data. Please check your connection.", "error");
            // Fallback or error state could go here
            this.renderContent(); // Render with defaults/empty if failed
            this.addEventListeners();
            this.initializeTheme();
        }
    }

    initializeTheme() {
        // Check localStorage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        // Re-render toggle button icon specifically if needed, or entire header
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const btn = document.getElementById('theme-toggle');
        const isDark = document.documentElement.classList.contains('dark');
        if (btn) {
            btn.innerHTML = `<span class="material-icons-round text-xl">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
        }
    }

    getLoadingSkeleton() {
        // Tailwind Skeleton
        return `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
                <!-- Header Skeleton -->
                <header class="sticky top-0 z-50 h-[72px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-center">
                    <div class="w-full max-w-7xl px-4 flex justify-between items-center">
                        <div class="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div class="flex gap-4">
                            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </header>

                <main class="w-full max-w-6xl mx-auto px-4 pt-12 pb-20 flex flex-col gap-16">
                    <!-- Hero Skeleton -->
                    <div class="w-full h-[400px] bg-gray-200 dark:bg-gray-900 rounded-3xl animate-pulse"></div>
                    
                    <!-- Grid Skeleton -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="h-64 bg-gray-200 dark:bg-gray-900 rounded-2xl animate-pulse"></div>
                        <div class="h-64 bg-gray-200 dark:bg-gray-900 rounded-2xl animate-pulse"></div>
                        <div class="h-64 bg-gray-200 dark:bg-gray-900 rounded-2xl animate-pulse"></div>
                    </div>
                </main>
            </div>
        `;
    }

    renderContent() {
        // Default empty state for smooth loading/error handling
        const { userName, wordOfTheDay, wordsLearned, trending } = this.dashboardData || {
            userName: this.user?.displayName?.split(' ')[0] || 'Learner',
            wordsLearned: 0,
            wordOfTheDay: null, // Handle null explicitly
            trending: []
        };

        // Create a safe default, but PRIORITIZE Firestore data (fsData) because it holds the Base64 image
        // that Auth profile cannot store.
        const fsPhoto = this.user?.fsData?.photoURL;
        const authPhoto = this.user?.photoURL;
        const avatarUrl = fsPhoto || authPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`;

        const html = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 relative overflow-hidden">
                <!-- Mesh Gradients -->
                <div class="mesh-gradient-1"></div>
                <div class="mesh-gradient-2"></div>

                <!-- 🧊 GLOBAL HEADER -->
                <header class="sticky top-0 z-50 h-[80px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-center transition-colors duration-300">
                    <div class="w-full max-w-7xl px-6 flex justify-between items-center">
                        <!-- Logo -->
                        <div class="flex items-center gap-1">
                            <div class="flex items-center gap-2 cursor-pointer select-none" id="brand-logo" role="button" tabindex="0" aria-label="Go to home">
                               <span class="material-icons-round text-brand-600 dark:text-brand-400 text-3xl">school</span>
                               <span class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Wexam</span>
                            </div>
                            <!-- Nav Dropdown -->
                            <div class="relative" id="wexam-nav-wrap">
                                <button id="wexam-nav-toggle" class="flex items-center ml-1 px-2 py-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Navigation menu">
                                    <span class="material-icons-round text-lg">expand_more</span>
                                </button>
                                <div id="wexam-nav-dropdown" class="absolute left-0 mt-2 w-52 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 transform origin-top-left transition-all duration-200 scale-95 opacity-0 invisible z-50">
                                    <ul class="py-1">
                                        <li>
                                            <button class="wexam-nav-item w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors font-medium" data-route="home">
                                                <span class="material-icons-round text-brand-500 text-lg">menu_book</span>
                                                Dictionary
                                            </button>
                                        </li>
                                        <li>
                                            <button class="wexam-nav-item w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors" data-route="quizlab">
                                                <span class="material-icons-round text-cyan-500 text-lg">quiz</span>
                                                QuizLab
                                            </button>
                                        </li>
                                        <li>
                                            <button class="wexam-nav-item w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors" data-route="resources">
                                                <span class="material-icons-round text-amber-500 text-lg">folder_open</span>
                                                Resources
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Right Actions -->
                        <div class="flex items-center gap-4">
                            <!-- Theme Toggle -->
                            <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle dark mode">
                                <span class="material-icons-round text-xl">dark_mode</span>
                            </button>

                            <!-- Profile -->
                            <div class="relative" id="profile-menu-container">
                                <button id="profile-btn" class="flex items-center gap-3 pl-1 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                    <img src="${avatarUrl}" alt="Profile" class="w-9 h-9 rounded-full object-cover shadow-sm">
                                    <span class="material-icons-round text-gray-400">expand_more</span>
                                </button>

                                <!-- Dropdown Menu -->
                                <div id="profile-dropdown" class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 transform origin-top-right transition-all duration-200 scale-95 opacity-0 invisible z-50">
                                    <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${escapeHtml(userName)}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Learner</p>
                                    </div>
                                    <ul class="py-1">
                                        <li>
                                            <button id="menu-profile" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-gray-400 text-lg">person</span>
                                                My Profile
                                            </button>
                                        </li>
                                        <li>
                                            <button id="menu-saved" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-gray-400 text-lg">bookmarks</span>
                                                Saved Words
                                            </button>
                                        </li>
                                        <div class="my-1 border-t border-gray-100 dark:border-gray-800"></div>
                                        <li>
                                            <button id="menu-faq" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-gray-400 text-lg">help</span>
                                                Help Center
                                            </button>
                                        </li>
                                        <li>
                                            <button id="menu-privacy" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-gray-400 text-lg">policy</span>
                                                Privacy
                                            </button>
                                        </li>
                                         <li>
                                            <button id="menu-terms" class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-gray-400 text-lg">description</span>
                                                Terms
                                            </button>
                                        </li>
                                        <div class="my-1 border-t border-gray-100 dark:border-gray-800"></div>
                                        <li>
                                            <button id="menu-logout" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors">
                                                <span class="material-icons-round text-red-500 text-lg">logout</span>
                                                Sign Out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="w-full max-w-6xl mx-auto px-6 pt-16 flex flex-col gap-20">
                    
                    <!-- 🔍 HERO SEARCH SECTION -->
                    <section class="w-full relative group z-30">
                        <!-- Hero Container -->
                        <div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        
                        <div class="relative w-full bg-white/80 dark:bg-gray-900/40 backdrop-blur-lg border border-white/50 dark:border-gray-700/50 rounded-[1.8rem] p-6 md:p-16 flex flex-col gap-6 md:gap-10 shadow-2xl shadow-blue-900/5">
                            
                            <!-- Hero Headline -->
                            <h1 class="text-4xl md:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl">
                                <span class="block text-gray-900 dark:text-white">
                                    What word are you
                                </span>
                                <span class="block text-gray-900 dark:text-white">looking for?</span>
                            </h1>

                            <!-- Search Input -->
                            <div class="relative w-full max-w-3xl group/input z-40">
                                <div class="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none">
                                    <span class="material-icons-round text-gray-400 text-xl md:text-3xl group-focus-within/input:text-brand-600 dark:group-focus-within/input:text-brand-400 transition-colors">search</span>
                                </div>
                                <input type="text" id="hero-search" 
                                    class="w-full h-14 md:h-20 pl-12 md:pl-20 pr-12 md:pr-32 bg-white dark:bg-gray-950 rounded-2xl text-lg md:text-2xl text-gray-900 dark:text-white placeholder:text-gray-500 placeholder:font-serif focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-xl shadow-blue-900/5 transition-all"
                                    placeholder="Search for any word..." autocomplete="off">
                                
                                <!-- Keyboard Hint -->
                                <div class="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                    <div class="hidden md:flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                        <span class="text-xs font-bold text-gray-500 font-sans">⌘K</span>
                                    </div>
                                </div>

                                <!-- Suggestions Dropdown -->
                                <div id="search-suggestions" class="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform origin-top transition-all duration-200 scale-95 opacity-0 invisible">
                                    <!-- Suggestions will be injected here -->
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- 🧱 BENTO GRID -->
                    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 animate-fade-in-up">
                        
                        <!-- Card 1: Word of the Day -->
                        <div class="group relative bg-white dark:bg-gray-900/80 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-800 hover:border-blue-500/50" id="card-wotd">
                             ${wordOfTheDay ? `
                                <div class="flex flex-col h-full justify-between">
                                    <div>
                                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                                            Word of the Day
                                        </div>
                                        <h3 class="text-3xl font-serif font-medium text-gray-900 dark:text-white mb-2">
                                            ${escapeHtml(wordOfTheDay.word)}
                                        </h3>
                                        <p class="text-gray-500 dark:text-gray-400 font-serif italic mb-4">
                                            ${wordOfTheDay.pronunciation || ''}
                                        </p>
                                        <p class="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                                            ${escapeHtml(wordOfTheDay.definition)}
                                        </p>
                                    </div>
                                    <div class="mt-6 flex items-center text-brand-600 dark:text-brand-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                        Learn more <span class="material-icons-round text-lg ml-1">arrow_forward</span>
                                    </div>
                                </div>
                             ` : `
                                <!-- WOTD Skeleton -->
                                <div class="animate-pulse flex flex-col h-full">
                                     <div class="w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded-full mb-6"></div>
                                     <div class="w-48 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"></div>
                                     <div class="w-full h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                </div>
                             `}
                        </div>

                        <!-- Card 2: User Stats & Level -->
                        <div class="bg-white dark:bg-gray-900/80 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-violet-500/50">
                            <div class="flex flex-col h-full">
                                <span class="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Your Progress</span>
                                
                                <!-- Level Info -->
                                <div class="flex items-center justify-between mb-2">
                                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Level ${Math.floor(wordsLearned / 10) + 1}</h3>
                                    <span class="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-full uppercase tracking-wide">
                                        ${wordsLearned < 10 ? 'Novice' : wordsLearned < 50 ? 'Scholar' : 'Linguist'}
                                    </span>
                                </div>

                                <div class="flex-1 flex flex-col justify-center items-center text-center py-4">
                                    <span class="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-violet-500 to-fuchsia-500 font-display transition-all hover:scale-110 duration-300 cursor-default">
                                        ${wordsLearned}
                                    </span>
                                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Total Words</span>
                                </div>

                                <!-- Progress Bar -->
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <span>Current Level</span>
                                        <span>${wordsLearned % 10} / 10 to Next</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                        <div class="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 ease-out" style="width: ${(wordsLearned % 10) * 10}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 3: Trending Words -->
                        <div class="bg-white dark:bg-gray-900/80 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-pink-500/50">
                            <span class="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6 block">Trending Now</span>
                            <div class="flex flex-col gap-3">
                                ${trending && trending.length > 0 ? trending.map(item => `
                                    <div class="group/item flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer" data-word="${item.word}">
                                        <div>
                                            <span class="block text-gray-900 dark:text-white font-semibold group-hover/item:text-brand-600 transition-colors">${escapeHtml(item.word)}</span>
                                            <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">${escapeHtml(item.definition)}</span>
                                        </div>
                                        <span class="material-icons-round text-gray-300 group-hover/item:text-brand-500">chevron_right</span>
                                    </div>
                                `).join('') : `
                                    <!-- Trending Skeleton -->
                                    <div class="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                                    <div class="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                                    <div class="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                                `}
                            </div>
                        </div>

                    </section>

                    <!-- Footer -->
                     <footer class="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-950/80">
                        <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <p>&copy; ${new Date().getFullYear()} Wexam. All rights reserved.</p>
                            <div class="flex gap-8">
                                <button id="footer-privacy" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</button>
                                <button id="footer-terms" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</button>
                                <a href="mailto:support@wexam.app" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Support</a>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        `;

        this.container.innerHTML = html;
        this.updateThemeIcon();
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
                const items = suggestionsBox.querySelectorAll('button');
                if (e.key === 'Enter') {
                    if (searchInput.value.trim()) {
                        this.navigateToDetails(searchInput.value.trim());
                        this.hideSuggestions(suggestionsBox);
                    }
                }
                // Add Arrow key navigation logic here if desired for extra polish
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

        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Profile Nav & Dropdown
        const profileBtn = document.getElementById('profile-btn');
        const dropdown = document.getElementById('profile-dropdown');
        const container = document.getElementById('profile-menu-container');

        if (profileBtn && dropdown) {
            // Toggle
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('opacity-0');
                dropdown.classList.toggle('invisible');
                dropdown.classList.toggle('scale-95');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (container && !container.contains(e.target)) {
                    dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                }
            });

            // Menu Actions
            const menuActions = {
                'menu-profile': () => this.navigateToProfile && this.navigateToProfile(),
                'menu-saved': () => this.navigateToSaved && this.navigateToSaved(),
                'menu-faq': () => this.onNavigateStatic && this.onNavigateStatic('faq'),
                'menu-privacy': () => this.onNavigateStatic && this.onNavigateStatic('privacy'),
                'menu-terms': () => this.onNavigateStatic && this.onNavigateStatic('terms'),
                'menu-logout': () => AuthService.logout()
            };

            Object.entries(menuActions).forEach(([id, action]) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        action();
                        // Close dropdown after click
                        dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                    });
                }
            });
        }

        // Wexam Nav Dropdown
        const wexamNavToggle = document.getElementById('wexam-nav-toggle');
        const wexamNavDropdown = document.getElementById('wexam-nav-dropdown');
        const wexamNavWrap = document.getElementById('wexam-nav-wrap');

        if (wexamNavToggle && wexamNavDropdown) {
            wexamNavToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                wexamNavDropdown.classList.toggle('opacity-0');
                wexamNavDropdown.classList.toggle('invisible');
                wexamNavDropdown.classList.toggle('scale-95');
            });

            document.addEventListener('click', (e) => {
                if (wexamNavWrap && !wexamNavWrap.contains(e.target)) {
                    wexamNavDropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                }
            });

            wexamNavDropdown.querySelectorAll('.wexam-nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const route = item.dataset.route;
                    wexamNavDropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                    if (route === 'home') { /* already here */ }
                    else if (route === 'quizlab') {
                        if (this.onNavigateStatic) this.onNavigateStatic('quizlab');
                    }
                    else if (route === 'resources') {
                        toast.show('Resources coming soon!', 'info');
                    }
                });
            });
        }


        // Scroll Effect for Header
        const header = document.querySelector('header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 10) {
                    header.classList.add('shadow-md', 'bg-white/90', 'dark:bg-gray-900/90');
                    header.classList.remove('bg-white/70', 'dark:bg-gray-900/70');
                } else {
                    header.classList.remove('shadow-md', 'bg-white/90', 'dark:bg-gray-900/90');
                    header.classList.add('bg-white/70', 'dark:bg-gray-900/70');
                }
            });
        }

        // Footer Link Handlers
        const footerPrivacy = document.getElementById('footer-privacy');
        const footerTerms = document.getElementById('footer-terms');

        if (footerPrivacy) {
            footerPrivacy.addEventListener('click', () => {
                if (this.onNavigateStatic) this.onNavigateStatic('privacy');
            });
        }

        if (footerTerms) {
            footerTerms.addEventListener('click', () => {
                if (this.onNavigateStatic) this.onNavigateStatic('terms');
            });
        }
    }

    renderSuggestions(suggestions, query, container, input) {
        if (!suggestions || suggestions.length === 0) {
            this.hideSuggestions(container);
            return;
        }

        container.innerHTML = suggestions.map(word => {
            const safeWord = word.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `
            <button class="w-full text-left px-4 md:px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group suggestion-item" data-word="${safeWord}">
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
