import { AuthService } from '../services/auth.js';
import { DBService } from '../services/db.js';
import { toast } from '../utils/toast.js';
import { ErrorHandler } from '../utils/errorHandler.js';

export class ProfileScreen {
    constructor(containerId, currentUser, navigateHome) {
        this.container = document.getElementById(containerId);
        this.currentUser = currentUser;
        this.navigateHome = navigateHome;
        this.render();
    }

    render() {
        if (!this.currentUser) {
            this.navigateHome();
            return;
        }
        const displayName = this.currentUser.displayName || 'Learner';
        const defaultAvatar = `https://ui-avatars.com/api/?name=${displayName}&background=2563EB&color=fff&size=128`;
        const photoURL = (this.currentUser.fsData && this.currentUser.fsData.photoURL) || this.currentUser.photoURL || defaultAvatar;
        const email = this.currentUser.email || '';

        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
                <div class="mesh-gradient-1 fixed top-0 left-0 w-full h-full pointer-events-none z-0"></div>
                <div class="mesh-gradient-2 fixed top-0 right-0 w-full h-full pointer-events-none z-0"></div>

                <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                    <div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button class="btn-icon back-btn w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                                <span class="material-icons-round">arrow_back</span>
                            </button>
                            <h1 class="text-lg font-bold text-gray-900 dark:text-white">My Profile</h1>
                        </div>
                    </div>
                </header>

                <main class="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 fade-in">
                    
                    <!-- Profile Card -->
                    <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                        <div class="flex flex-col items-center mb-8">
                            <div class="relative group">
                                <img src="${photoURL}" alt="Profile" class="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800" id="profile-preview">
                                <button class="edit-avatar-btn absolute bottom-0 right-0 w-8 h-8 bg-brand-600 dark:bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand-700 dark:hover:bg-cyan-400 transition-colors" aria-label="Change photo">
                                    <span class="material-icons-round text-sm">photo_camera</span>
                                </button>
                                <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                            </div>
                            <h2 class="mt-4 text-xl font-bold text-gray-900 dark:text-white">${displayName}</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Vocabulary Enthusiast</p>
                        </div>
                        
                        <form id="profile-form" class="space-y-5">
                            <div class="space-y-1">
                                <label for="display-name" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                                <input type="text" id="display-name" value="${displayName}" autocomplete="name" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-cyan-500/50 transition-all font-medium" placeholder="Your Name" required>
                            </div>
                            <div class="space-y-1">
                                <label for="photo-url" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Avatar URL (Optional)</label>
                                <input type="url" id="photo-url" value="${photoURL !== 'https://via.placeholder.com/80' ? photoURL : ''}" autocomplete="url" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-cyan-500/50 transition-all text-sm font-mono" placeholder="https://example.com/photo.jpg">
                            </div>
                            <div class="space-y-1 opacity-75">
                                <label for="email" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Email</label>
                                <div class="relative">
                                    <input type="email" id="email" value="${email}" disabled autocomplete="email" class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-transparent rounded-xl text-gray-500 dark:text-gray-500 cursor-not-allowed select-none">
                                    <span class="absolute right-4 top-3.5 material-icons-round text-gray-400 text-sm">lock</span>
                                </div>
                            </div>
                            <div class="pt-2">
                                <button type="submit" class="btn-save w-full bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black font-semibold py-3.5 rounded-xl shadow-lg shadow-gray-200 dark:shadow-none transition-all duration-200 transform hover:-translate-y-0.5">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </section>

                    <!-- Performance Dashboard (loaded async) -->
                    <!-- Performance Link Card -->
                    <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-5 shadow-sm">
                        <button id="perf-link-card" class="w-full flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-brand-50 dark:bg-cyan-900/30 flex items-center justify-center">
                                    <span class="material-icons-round text-brand-600 dark:text-cyan-400">insights</span>
                                </div>
                                <div class="text-left">
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Quiz Performance</span>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">Scores, chapters, improvement tips</span>
                                </div>
                            </div>
                            <span class="material-icons-round text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-cyan-400 transition-colors">chevron_right</span>
                        </button>
                    </section>

                    <!-- Security Card -->
                    <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span class="material-icons-round text-gray-400 dark:text-gray-500">security</span>
                            Security
                        </h3>
                        <form id="password-form" class="space-y-5">
                            <div class="space-y-1">
                                <label for="current-password" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Current Password</label>
                                <input type="password" id="current-password" autocomplete="current-password" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-cyan-500/50 transition-all" placeholder="••••••••" required>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="space-y-1">
                                    <label for="new-password" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">New Password</label>
                                    <input type="password" id="new-password" autocomplete="new-password" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-cyan-500/50 transition-all" placeholder="Min 6 chars" minlength="6" required>
                                </div>
                                <div class="space-y-1">
                                    <label for="confirm-password" class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Confirm</label>
                                    <input type="password" id="confirm-password" autocomplete="new-password" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-cyan-500/50 transition-all" placeholder="••••••••" minlength="6" required>
                                </div>
                            </div>
                            <div class="pt-2">
                                <button type="submit" class="btn-security w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl transition-all duration-200">
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </section>

                    <!-- Account Actions -->
                    <section class="flex justify-center pt-2 pb-4">
                        <button id="logout-btn-profile" class="flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors min-h-[44px]">
                            <span class="material-icons-round">logout</span>
                            Sign Out
                        </button>
                    </section>
                </main>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        // Navigation
        this.container.querySelector('.back-btn').addEventListener('click', () => {
            this.navigateHome();
        });

        // Performance link card
        const perfCard = this.container.querySelector('#perf-link-card');
        if (perfCard) {
            perfCard.addEventListener('click', () => {
                window.location.hash = '#performance';
            });
        }

        // Profile Update
        const profileForm = this.container.querySelector('#profile-form');
        const photoInput = this.container.querySelector('#photo-url');
        const preview = this.container.querySelector('#profile-preview');

        photoInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url) preview.src = url;
        });

        const fileInput = this.container.querySelector('#avatar-input');
        const editBtn = this.container.querySelector('.edit-avatar-btn');

        editBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                try {
                    const base64 = await this.resizeImage(e.target.files[0]);
                    preview.src = base64;
                    photoInput.value = base64;
                } catch (err) {
                    toast.show(ErrorHandler.handle(err), 'error');
                }
            }
        });

        preview.addEventListener('error', () => {
            const name = this.container.querySelector('#display-name').value || 'Learner';
            preview.src = `https://ui-avatars.com/api/?name=${name}&background=2563EB&color=fff&size=128`;
        });

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = this.container.querySelector('#display-name').value;
            const photo = photoInput.value;
            const btn = profileForm.querySelector('.btn-save');

            if (btn.disabled) return; // prevent double submit

            try {
                btn.textContent = 'Saving...';
                btn.disabled = true;

                const authUpdates = { displayName: name };
                if (!photo.startsWith('data:')) {
                    authUpdates.photoURL = photo;
                }

                await AuthService.updateUserProfile(this.currentUser, authUpdates);
                await DBService.updateUserProfile(this.currentUser.uid, {
                    name: name,
                    photoURL: photo
                });

                toast.show('Profile updated successfully!', 'success');
            } catch (error) {
                toast.show(ErrorHandler.handle(error), 'error');
            } finally {
                btn.textContent = 'Save Changes';
                btn.disabled = false;
            }
        });

        // Password Update
        const passwordForm = this.container.querySelector('#password-form');
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPass = this.container.querySelector('#current-password').value;
            const newPass = this.container.querySelector('#new-password').value;
            const confirmPass = this.container.querySelector('#confirm-password').value;
            const btn = passwordForm.querySelector('.btn-security');

            if (btn.disabled) return; // prevent double submit

            if (newPass !== confirmPass) {
                toast.show('Passwords do not match', 'error');
                return;
            }

            try {
                btn.textContent = 'Verifying...';
                btn.disabled = true;

                await AuthService.reauthenticate(this.currentUser, currentPass);
                btn.textContent = 'Updating...';
                await AuthService.updateUserPassword(this.currentUser, newPass);

                toast.show('Password updated successfully!', 'success');
                passwordForm.reset();
            } catch (error) {
                toast.show(ErrorHandler.handle(error), 'error');
            } finally {
                btn.textContent = 'Update Password';
                btn.disabled = false;
            }
        });

        // Logout
        this.container.querySelector('#logout-btn-profile').addEventListener('click', async () => {
            try {
                await AuthService.logout();
            } catch (error) {
                toast.show(ErrorHandler.handle(error), 'error');
            }
        });
    }

    resizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 512;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL(file.type));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }
}
