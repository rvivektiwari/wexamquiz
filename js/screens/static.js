export class StaticScreen {
    constructor(containerId, onNavigateLogin) {
        this.container = document.getElementById(containerId);
        this.onNavigateLogin = onNavigateLogin;
    }

    render(pageType) {
        let content = '';
        let title = '';

        switch (pageType) {
            case 'privacy':
                title = 'Privacy Policy';
                content = this.getPrivacyContent();
                break;
            case 'terms':
                title = 'Terms of Use';
                content = this.getTermsContent();
                break;
            case 'faq':
                title = 'Help Center';
                content = this.getFAQContent();
                break;
            default:
                title = 'Page Not Found';
                content = '<p>The page you are looking for does not exist.</p>';
        }

        this.renderFrame(title, content);
    }

    renderFrame(title, content) {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 flex flex-col">
                <!-- Header -->
                <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
                    <div class="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                        <div class="flex items-center gap-3 cursor-pointer" id="static-logo">
                            <span class="material-icons-round text-brand-600 dark:text-brand-400 text-2xl">school</span>
                            <span class="font-bold text-lg text-gray-900 dark:text-white tracking-tight">Wexam</span>
                        </div>
                        <button id="static-close-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Close">
                             <span class="material-icons-round">close</span>
                        </button>
                    </div>
                </header>

                <main class="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 fade-in">
                    <div class="prose prose-lg prose-gray dark:prose-invert max-w-none">
                        <h1 class="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-8">${title}</h1>
                        ${content}
                    </div>
                </main>

                <!-- Simple Footer -->
                <footer class="border-t border-gray-200 dark:border-gray-800 py-8 bg-white dark:bg-gray-900">
                    <div class="max-w-5xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p>&copy; ${new Date().getFullYear()} Wexam. All rights reserved.</p>
                            <div class="flex gap-6">
                                <a href="#" onclick="window.location.hash='#privacy'; return false;" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</a>
                                <a href="#" onclick="window.location.hash='#terms'; return false;" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms</a>
                                <a href="mailto:support@wexam.app" class="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        `;

        document.getElementById('static-close-btn').addEventListener('click', () => {
            // Try to go back in history first, else default callback
            if (window.history.length > 1) {
                window.history.back();
            } else if (this.onNavigateLogin) {
                this.onNavigateLogin();
            }
        });

        document.getElementById('static-logo').addEventListener('click', () => {
            if (this.onNavigateLogin) this.onNavigateLogin();
        });
    }

    getPrivacyContent() {
        return `
            <p>At Wexam, we take your privacy seriously. This policy describes how we handle your data.</p>
            <h3>1. Data Collection</h3>
            <p>We collect basic account information (name, email) and your learning history (saved words, search history) to provide a personalized experience.</p>
            <h3>2. Data Usage</h3>
            <p>Your data is used solely to improve your vocabulary learning journey. We do not sell your personal data to third parties.</p>
            <h3>3. Security</h3>
            <p>We use industry-standard security measures, including Firebase Authentication and encrypted connections, to protect your information.</p>
        `;
    }

    getTermsContent() {
        return `
            <p>By using Wexam, you agree to the following terms.</p>
            <h3>1. Valid Use</h3>
            <p>Wexam is for personal educational use. Automated scraping or misuse of our API connections is prohibited.</p>
            <h3>2. Content</h3>
            <p>Definitions and audio are provided by third-party APIs. We strive for accuracy but cannot guarantee it.</p>
            <h3>3. Termination</h3>
            <p>We reserve the right to suspend accounts that violate these terms or engage in abusive behavior.</p>
        `;
    }

    getFAQContent() {
        return `
            <div class="space-y-6 not-prose">
                <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Is Wexam free?</h3>
                    <p class="text-gray-600 dark:text-gray-300">Yes! Wexam is currently 100% free for all learners.</p>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Where do definitions come from?</h3>
                    <p class="text-gray-600 dark:text-gray-300">We aggregate data from multiple open-source dictionary APIs to provide comprehensive meanings.</p>
                </div>
                <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Can I use it offline?</h3>
                    <p class="text-gray-600 dark:text-gray-300">Currently, Wexam requires an internet connection to fetch real-time data.</p>
                </div>
                 <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">How do I delete my data?</h3>
                    <p class="text-gray-600 dark:text-gray-300">You can contact support at help@wexam.app to request full data deletion.</p>
                </div>
            </div>
            <p class="mt-8 text-center text-gray-600 dark:text-gray-400">Still have questions? Contact us at <a href="mailto:support@wexam.app" class="text-brand-600 dark:text-brand-400 hover:underline">support@wexam.app</a></p>
        `;
    }
}
