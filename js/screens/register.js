import { AuthService } from '../services/auth.js';
import { toast } from '../utils/toast.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export class RegisterScreen {
    constructor(containerId, onNavigateLogin, onNavigateStatic) {
        this.container = document.getElementById(containerId);
        this.onNavigateLogin = onNavigateLogin;
        this.onNavigateStatic = onNavigateStatic;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 relative overflow-hidden transition-colors duration-300">
                <!-- Background Atmosphere -->
                <div class="mesh-gradient-1"></div>
                <div class="mesh-gradient-2"></div>

                <!-- Register Card -->
                <div class="relative w-full max-w-md p-6 md:p-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-2xl shadow-violet-900/5 fade-in mx-4">
                    
                    <!-- Header -->
                    <div class="flex flex-col items-center text-center mb-8">
                         <div class="flex items-center gap-2 mb-6">
                            <span class="material-icons-round text-brand-600 dark:text-brand-400 text-4xl">school</span>
                            <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Wexam</h1>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Create Account</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Join thousands of learners today</p>
                    </div>

                    <!-- Google Sign Up -->
                    <button id="google-register-btn" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-xl transition-all duration-200 mb-6">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5">
                        <span>Sign up with Google</span>
                    </button>

                    <!-- Divider -->
                    <div class="relative flex items-center py-2 mb-6">
                        <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        <span class="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">or with email</span>
                        <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    </div>

                    <!-- Form -->
                    <form id="register-form" class="space-y-5" novalidate>
                        <!-- Email Input -->
                         <div class="space-y-1 group">
                            <label for="reg-email" class="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="material-icons-round text-gray-400">email</span>
                                </span>
                                <input type="email" id="reg-email" autocomplete="email"
                                    class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                                    placeholder="your@email.com" required>
                            </div>
                        </div>

                        <!-- Password Input -->
                         <div class="space-y-1 group">
                            <label for="reg-password" class="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Password</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="material-icons-round text-gray-400">lock</span>
                                </span>
                                <input type="password" id="reg-password" autocomplete="new-password"
                                    class="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                                    placeholder="Create a password" required>
                                <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" id="toggle-reg-password">
                                    <span class="material-icons-round">visibility</span>
                                </button>
                            </div>
                        </div>

                        <!-- Confirm Password Input -->
                         <div class="space-y-1 group">
                            <label for="confirm-password" class="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="material-icons-round text-gray-400">lock_reset</span>
                                </span>
                                <input type="password" id="confirm-password" autocomplete="new-password"
                                    class="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                                    placeholder="Confirm password" required>
                                <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" id="toggle-confirm-password">
                                    <span class="material-icons-round">visibility</span>
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all duration-200 transform hover:-translate-y-0.5">
                            Create Account
                            <span class="material-icons-round text-lg">arrow_forward</span>
                        </button>
                    </form>

                    <!-- Footer -->
                    <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account? 
                            <a href="#" id="login-link" class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">Sign in here</a>
                        </p>
                         <div class="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-4">
                            <a href="#" id="link-privacy" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</a>
                            <span>•</span>
                            <a href="#" id="link-terms" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</a>
                            <span>•</span>
                            <a href="#" id="link-help" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Help</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        const form = document.getElementById('register-form');
        const googleBtn = document.getElementById('google-register-btn');
        const loginLink = document.getElementById('login-link');

        // Navigation
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.onNavigateLogin) this.onNavigateLogin();
        });

        // Legal Links
        document.getElementById('link-privacy').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.onNavigateStatic) this.onNavigateStatic('privacy');
        });

        document.getElementById('link-terms').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.onNavigateStatic) this.onNavigateStatic('terms');
        });

        document.getElementById('link-help').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.onNavigateStatic) this.onNavigateStatic('faq');
        });

        // Google Sign Up
        googleBtn.addEventListener('click', async () => {
            try {
                await AuthService.loginWithGoogle();
            } catch (error) {
                toast.show(ErrorHandler.handle(error), 'error');
            }
        });

        // Email Registration
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('reg-email');
            const passwordInput = document.getElementById('reg-password');
            const confirmInput = document.getElementById('confirm-password');

            const email = emailInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmInput.value;

            let isValid = true;

            if (!this.validateEmail(email)) {
                this.showInputError(emailInput, 'Please enter a valid email address');
                isValid = false;
            }

            if (!this.validatePassword(password)) {
                this.showInputError(passwordInput, 'Password must be at least 6 characters');
                isValid = false;
            }

            if (password !== confirmPassword) {
                this.showInputError(confirmInput, 'Passwords do not match');
                isValid = false;
            }

            if (!isValid) return;

            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="material-icons-round spin">sync</span> Creating...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            try {
                await AuthService.registerWithEmail(email, password);
                toast.show('Account created successfully!', 'success');
                // App.js observer will handle navigation
            } catch (error) {
                toast.show(ErrorHandler.handle(error), 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });

        // Real-time Validation
        const inputs = ['reg-email', 'reg-password', 'confirm-password'].map(id => document.getElementById(id));

        inputs.forEach(input => {
            input.addEventListener('input', () => this.clearInputError(input));
        });

        // Password Toggles
        this.setupPasswordToggle('toggle-reg-password', 'reg-password');
        this.setupPasswordToggle('toggle-confirm-password', 'confirm-password');
    }

    setupPasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);

        btn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            btn.querySelector('.material-icons-round').textContent = type === 'password' ? 'visibility' : 'visibility_off';
        });
    }

    validateEmail(email) {
        return String(email).toLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    showInputError(input, message) {
        const group = input.closest('.group');
        if (!group) {
            // Fallback: show as toast if parent wrapper not found
            toast.show(message, 'error');
            return;
        }
        this.clearInputError(input);

        const msgDiv = document.createElement('div');
        msgDiv.className = 'text-xs text-red-500 mt-1 ml-1 font-medium';
        msgDiv.textContent = message;
        group.appendChild(msgDiv);
        input.classList.add('border-red-500', 'focus:ring-red-500/50');
    }

    clearInputError(input) {
        const group = input.closest('.group');
        if (!group) return;
        const msg = group.querySelector('.text-red-500');
        if (msg) msg.remove();
        input.classList.remove('border-red-500', 'focus:ring-red-500/50');
    }
}
