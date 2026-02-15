import { AuthService } from '../services/auth.js';
import { escapeHtml } from '../utils/sanitize.js';
import { toast } from '../utils/toast.js';

export class Layout {
    constructor(containerId, user, options = {}) {
        this.containerId = containerId;
        this.user = user;
        this.options = options;
        this.onNavigate = options.onNavigate || (() => { });
        this.onLogout = options.onLogout || (() => AuthService.logout());
    }

    render(content) {
        const userName = this.user?.displayName?.split(' ')[0] || 'Learner';
        const fsPhoto = this.user?.fsData?.photoURL;
        const authPhoto = this.user?.photoURL;
        const avatarUrl = fsPhoto || authPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`;

        // 🧠 Logic: Show header/footer if explicitly requested, OR if logged in options are undefined
        // Default behavior: if isLoggedIn -> show, if not -> hide
        const isLoggedIn = !!this.user;
        const shouldShowHeader = this.options.showHeader !== undefined ? this.options.showHeader : isLoggedIn;
        const shouldShowFooter = this.options.showFooter !== undefined ? this.options.showFooter : isLoggedIn;

        const html = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 relative overflow-hidden flex flex-col">
                <!-- Mesh Gradients (Fixed Background) -->
                <div class="fixed inset-0 pointer-events-none z-0">
                     <div class="mesh-gradient-1"></div>
                     <div class="mesh-gradient-2"></div>
                </div>

                <!-- 🧊 GLOBAL HEADER -->
                ${shouldShowHeader ? `
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
                ` : ''}

                <main class="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 z-10">
                    ${content}
                </main>

                 ${shouldShowFooter ? `
                 <footer class="border-t border-gray-200 dark:border-gray-800 py-12 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm z-10">
                    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <p>&copy; ${new Date().getFullYear()} Wexam. All rights reserved.</p>
                        <div class="flex gap-8">
                            <button id="footer-privacy" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</button>
                            <button id="footer-terms" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</button>
                            <a href="mailto:support@wexam.app" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Support</a>
                        </div>
                    </div>
                </footer>
                ` : ''}
            </div>
        `;
        return html;
    }

    postRender() {
        this.initializeTheme();
        this.attachListeners();
    }

    initializeTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.updateThemeIcon();
    }

    toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const btn = document.getElementById('theme-toggle');
        const isDark = document.documentElement.classList.contains('dark');
        if (btn) {
            btn.innerHTML = `<span class="material-icons-round text-xl">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
        }
    }

    attachListeners() {
        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Brand Logo
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            brandLogo.addEventListener('click', () => this.onNavigate('home'));
        }

        this.setupDropdowns();
        this.setupFooter();
    }

    setupDropdowns() {
        // Profile Nav & Dropdown
        const profileBtn = document.getElementById('profile-btn');
        const dropdown = document.getElementById('profile-dropdown');
        const container = document.getElementById('profile-menu-container');

        if (profileBtn && dropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('opacity-0');
                dropdown.classList.toggle('invisible');
                dropdown.classList.toggle('scale-95');
                // Close other dropdown
                const wexamNavDropdown = document.getElementById('wexam-nav-dropdown');
                if (wexamNavDropdown && !wexamNavDropdown.classList.contains('invisible')) {
                    wexamNavDropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                }
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (container && !container.contains(e.target)) {
                    dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                }
            });

            // Menu Actions
            const menuActions = {
                'menu-profile': () => this.onNavigate('profile'),
                'menu-saved': () => this.onNavigate('saved'),
                'menu-faq': () => this.onNavigate('faq'),
                'menu-logout': this.onLogout
            };

            Object.entries(menuActions).forEach(([id, action]) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        action();
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
                // Close other dropdown
                if (dropdown && !dropdown.classList.contains('invisible')) {
                    dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                }
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
                    if (route === 'resources') {
                        toast.show('Resources coming soon!', 'info');
                    } else {
                        this.onNavigate(route);
                    }
                });
            });
        }
    }

    setupFooter() {
        const footerPrivacy = document.getElementById('footer-privacy');
        const footerTerms = document.getElementById('footer-terms');

        if (footerPrivacy) footerPrivacy.addEventListener('click', () => this.onNavigate('privacy'));
        if (footerTerms) footerTerms.addEventListener('click', () => this.onNavigate('terms'));
    }
}
