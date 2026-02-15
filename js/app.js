import { AuthService } from './services/auth.js';
import { DBService } from './services/db.js';
import { toast } from './utils/toast.js';

class App {
    constructor() {
        this.container = document.getElementById('app-root');
        this.currentUser = null;
        this.currentScreenInstance = null; // Track active screen for cleanup
        this.authReady = false;
        this.showLoadingState();
        this.setupOfflineDetection();
        this.init();
    }

    showLoadingState() {
        this.container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div class="flex flex-col items-center gap-4 fade-in">
                    <span class="material-icons-round text-brand-600 text-5xl animate-pulse">school</span>
                    <span class="text-lg font-semibold text-gray-400 dark:text-gray-500">Loading Wexam...</span>
                </div>
            </div>
        `;
    }

    setupOfflineDetection() {
        window.addEventListener('offline', () => {
            toast.show('You are offline. Some features may not work.', 'warning');
        });
        window.addEventListener('online', () => {
            toast.show('You are back online!', 'success');
        });
    }

    init() {
        AuthService.observeAuth(async (user) => {
            this.authReady = true;

            if (user) {
                this.currentUser = user;
                this.currentUser.fsData = {};
                await DBService.createUserProfile(user);
                DBService.subscribeToUserData(user.uid, (data) => {
                    if (data) this.currentUser.fsData = data;
                });

                // If on login/register, go to home
                if (window.location.hash === '#login' || window.location.hash === '#register' || window.location.hash === '') {
                    this.navigateTo('home', null, true);
                } else {
                    this.handleHashChange();
                }
            } else {
                this.currentUser = null;
                // If on protected route, go to login
                const publicRoutes = ['#login', '#register', '#privacy', '#terms', '#faq', '#support'];
                const currentHash = window.location.hash;

                if (!publicRoutes.includes(currentHash) && !publicRoutes.some(r => r.length > 1 && currentHash.startsWith(r))) {
                    this.navigateTo('login', null, true);
                } else {
                    this.handleHashChange();
                }
            }
        });

        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    handleHashChange() {
        // Don't process routes until auth has resolved
        if (!this.authReady) return;

        const hash = window.location.hash;

        // Guard protected routes — redirect to login if not authenticated
        const isProtectedRoute = hash.startsWith('#details=') || hash === '#saved' || hash === '#profile' || hash.startsWith('#quizlab') || hash === '#quiz' || hash === '#performance';
        if (isProtectedRoute && !this.currentUser) {
            this.navigateTo('login', null, true);
            return;
        }

        if (hash.startsWith('#details=')) {
            const word = decodeURIComponent(hash.substring(9));
            this.renderScreen('details', word);
        } else if (hash === '#saved') {
            this.renderScreen('saved');
        } else if (hash === '#profile') {
            this.renderScreen('profile');
        } else if (hash.startsWith('#quizlab')) {
            this.renderScreen('quizlab');
        } else if (hash === '#quiz') {
            this.renderScreen('quiz');
        } else if (hash === '#performance') {
            this.renderScreen('performance');
        } else if (hash === '#register') {
            this.renderScreen('register');
        } else if (hash === '#login') {
            this.renderScreen('login');
        } else if (['#privacy', '#terms', '#faq', '#support'].includes(hash)) {
            this.renderScreen(hash.substring(1));
        } else {
            this.renderScreen('home');
        }
    }

    navigateTo(screen, data = null, replace = false) {
        let newHash = '';
        switch (screen) {
            case 'home': newHash = ''; break;
            case 'login': newHash = '#login'; break;
            case 'register': newHash = '#register'; break;
            case 'details': newHash = `#details=${encodeURIComponent(data)}`; break;
            case 'saved': newHash = '#saved'; break;
            case 'profile': newHash = '#profile'; break;
            case 'quizlab': newHash = '#quizlab'; break;
            case 'quiz': newHash = '#quiz'; break;
            case 'performance': newHash = '#performance'; break;
            case 'privacy': newHash = '#privacy'; break;
            case 'terms': newHash = '#terms'; break;
            case 'faq': newHash = '#faq'; break;
            case 'support': newHash = '#support'; break;
        }

        if (replace) {
            // replaceState doesn't fire hashchange, so we must call handleHashChange manually
            history.replaceState(null, null, newHash || ' ');
            this.handleHashChange();
        } else {
            // Setting hash fires hashchange automatically — do NOT call handleHashChange
            window.location.hash = newHash;
        }
    }

    destroyCurrentScreen() {
        if (this.currentScreenInstance && typeof this.currentScreenInstance.destroy === 'function') {
            this.currentScreenInstance.destroy();
        }
        this.currentScreenInstance = null;
    }

    async renderScreen(screen, data = null) {
        // Cleanup previous screen (release Firestore subscriptions, event listeners, etc.)
        this.destroyCurrentScreen();

        // Clear container
        this.container.innerHTML = '';
        const screenDiv = document.createElement('div');
        screenDiv.id = `screen-${screen}`;
        screenDiv.className = 'screen-container';
        this.container.appendChild(screenDiv);

        try {
            switch (screen) {
                case 'login':
                    const { LoginScreen } = await import('./screens/login.js');
                    this.currentScreenInstance = new LoginScreen(
                        screenDiv.id,
                        () => this.navigateTo('register'),
                        (page) => this.navigateTo(page)
                    );
                    break;
                case 'register':
                    const { RegisterScreen } = await import('./screens/register.js');
                    this.currentScreenInstance = new RegisterScreen(
                        screenDiv.id,
                        () => this.navigateTo('login'),
                        (page) => this.navigateTo(page)
                    );
                    break;
                case 'privacy':
                case 'terms':
                case 'faq':
                case 'support':
                    const { StaticScreen } = await import('./screens/static.js');
                    const staticScreen = new StaticScreen(
                        screenDiv.id,
                        () => {
                            if (this.currentUser) {
                                this.navigateTo('home');
                            } else {
                                this.navigateTo('login');
                            }
                        }
                    );
                    staticScreen.render(screen);
                    this.currentScreenInstance = staticScreen;
                    break;
                case 'home':
                    const { HomeScreen } = await import('./screens/home.js');
                    const homeScreen = new HomeScreen(
                        screenDiv.id,
                        (word) => this.navigateTo('details', word),
                        () => this.navigateTo('saved'),
                        () => this.navigateTo('profile'),
                        (page) => this.navigateTo(page)
                    );
                    homeScreen.render(this.currentUser);
                    this.currentScreenInstance = homeScreen;
                    break;
                case 'details':
                    const { DetailsScreen } = await import('./screens/details.js');
                    const detailsScreen = new DetailsScreen(
                        screenDiv.id,
                        this.currentUser,
                        () => {
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                this.navigateTo('home');
                            }
                        }
                    );
                    detailsScreen.loadWord(data);
                    this.currentScreenInstance = detailsScreen;
                    break;
                case 'saved':
                    const { SavedScreen } = await import('./screens/saved.js');
                    const savedScreen = new SavedScreen(
                        screenDiv.id,
                        this.currentUser,
                        () => this.navigateTo('home'),
                        (word) => this.navigateTo('details', word)
                    );
                    savedScreen.render();
                    this.currentScreenInstance = savedScreen;
                    break;
                case 'quizlab':
                    const { QuizLabScreen } = await import('./screens/quizlab.js');
                    const quizLabScreen = new QuizLabScreen(
                        screenDiv.id,
                        this.currentUser,
                        (page) => this.navigateTo(page)
                    );
                    quizLabScreen.render();
                    this.currentScreenInstance = quizLabScreen;
                    break;
                case 'quiz':
                    const { QuizScreen } = await import('./screens/quiz.js');
                    const quizScreen = new QuizScreen(
                        screenDiv.id,
                        this.currentUser,
                        (page) => this.navigateTo(page)
                    );
                    quizScreen.render();
                    this.currentScreenInstance = quizScreen;
                    break;
                case 'performance':
                    const { PerformanceScreen } = await import('./screens/performance.js');
                    const perfScreen = new PerformanceScreen(
                        screenDiv.id,
                        this.currentUser,
                        (page) => this.navigateTo(page)
                    );
                    perfScreen.render();
                    this.currentScreenInstance = perfScreen;
                    break;
                case 'profile':
                    const { ProfileScreen } = await import('./screens/profile.js');
                    const profileScreen = new ProfileScreen(
                        screenDiv.id,
                        this.currentUser,
                        () => {
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                this.navigateTo('home');
                            }
                        }
                    );
                    profileScreen.render();
                    this.currentScreenInstance = profileScreen;
                    break;
            }
            // Scroll to top on navigation
            window.scrollTo(0, 0);
        } catch (error) {
            this.container.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load content. Please check your connection.</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
