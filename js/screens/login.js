import { AuthService } from '../services/auth.js';
import { toast } from '../utils/toast.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class LoginScreen {
    constructor(containerId, onNavigateRegister, onNavigateStatic) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.onNavigateRegister = onNavigateRegister;
        this.onNavigateStatic = onNavigateStatic;
        this.render();
    }

    render() {
        const contentHtml = `
            <div class="flex flex-col items-center text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Sign in to continue your vocabulary journey</p>
            </div>

            <!-- Google Login -->
            <button id="google-login-btn" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-xl transition-all duration-200 mb-6">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5">
                <span>Continue with Google</span>
            </button>

            <!-- Divider -->
            <div class="relative flex items-center py-2 mb-6">
                <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span class="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">or with email</span>
                <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <!-- Email Form -->
            <form id="email-signin-form" class="space-y-5" novalidate>
                <div class="space-y-1 group text-left">
                    <label for="email" class="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="material-icons-round text-gray-400">email</span>
                        </span>
                        <input type="email" id="email" autocomplete="email"
                            class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                            placeholder="your@email.com" required>
                    </div>
                </div>

                <div class="space-y-1 group text-left">
                        <div class="flex justify-between items-center ml-1">
                        <label for="password" class="text-xs font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <a href="#" class="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors forgot-pass">Forgot Password?</a>
                    </div>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="material-icons-round text-gray-400">lock</span>
                        </span>
                        <input type="password" id="password" autocomplete="current-password"
                            class="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                            placeholder="••••••••" required>
                        <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" id="toggle-password">
                            <span class="material-icons-round">visibility</span>
                        </button>
                    </div>
                </div>

                <button type="submit" class="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all duration-200 transform hover:-translate-y-0.5">
                    Sign In
                    <span class="material-icons-round text-lg">arrow_forward</span>
                </button>
            </form>

            <!-- Footer -->
            <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Don't have an account? 
                    <a href="#" id="create-account-link" class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors">Create free account</a>
                </p>
            </div>
        `;

        const layout = new Layout(this.containerId, null, { // User is null
            onNavigateStatic: this.onNavigateStatic
        });

        // Wrap in Card and center
        const cardHtml = Card(contentHtml, "max-w-md mx-auto w-full");

        // Center the card vertically in the layout
        const centeredWrapper = `<div class="flex flex-col justify-center min-h-[60vh]">${cardHtml}</div>`;

        this.container.innerHTML = layout.render(centeredWrapper);
        layout.postRender();
        this.addEventListeners();
    }

    addEventListeners() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const googleBtn = document.getElementById('google-login-btn');
        const emailForm = document.getElementById('email-signin-form');
        const createAccountLink = document.getElementById('create-account-link');
        const toggleBtn = document.getElementById('toggle-password');

        // Google Login
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    await AuthService.loginWithGoogle();
                } catch (error) {
                    toast.show(ErrorHandler.handle(error), 'error');
                }
            });
        }

        // Email Login
        if (emailForm) {
            emailForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = emailInput.value.trim();
                const password = passwordInput.value;

                if (!this.validateEmail(email)) {
                    toast.show('Please enter a valid email address', 'error');
                    emailInput.focus();
                    return;
                }

                if (!password) {
                    toast.show('Please enter your password', 'error');
                    passwordInput.focus();
                    return;
                }

                const btn = e.target.querySelector('button[type="submit"]');
                const originalContent = btn.innerHTML;

                btn.innerHTML = '<span class="material-icons-round animate-spin">refresh</span> Signing in...';
                btn.disabled = true;
                btn.classList.add('opacity-75', 'cursor-not-allowed');

                try {
                    await AuthService.loginWithEmail(email, password);
                } catch (error) {
                    toast.show(ErrorHandler.handle(error), 'error');
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                    btn.classList.remove('opacity-75', 'cursor-not-allowed');
                }
            });
        }

        // Register Switch
        if (createAccountLink) {
            createAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.onNavigateRegister) this.onNavigateRegister();
            });
        }

        // Forgot Password
        const forgotLink = this.container.querySelector('.forgot-pass');
        if (forgotLink) {
            forgotLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                if (!email) {
                    toast.show('Please enter your email address first', 'info');
                    emailInput.focus();
                    return;
                }
                try {
                    await AuthService.resetPassword(email);
                    toast.show('Password reset email sent!', 'success');
                } catch (error) {
                    toast.show(ErrorHandler.handle(error), 'error');
                }
            });
        }

        // Password Toggle
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                toggleBtn.querySelector('.material-icons-round').textContent = type === 'password' ? 'visibility' : 'visibility_off';
            });
        }
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
