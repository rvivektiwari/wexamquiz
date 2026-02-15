import { DBService } from '../services/db.js';
import { toast } from '../utils/toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { auth } from '../config/firebase-config.js';

export class QuizLabScreen {
    constructor(containerId, user, onNavigate) {
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onNavigate = onNavigate;

        // State
        this.uploadedText = '';
        this.selectedClass = '';
        this.selectedSubject = '';
        this.chapterName = '';
        this.difficulty = 'medium';
        this.questionType = 'mcq';
        this.questionCount = 10;
        this.isGenerating = false;
        this.isDragOver = false;
    }

    render() {
        this.container.innerHTML = this.getHTML();
        this.addEventListeners();
        this.initializeTheme();
        this.applyUrlPrefill();
    }

    applyUrlPrefill() {
        // Pre-fill fields from URL params (e.g. #quizlab?subject=Math&chapter=Ch1)
        const hash = window.location.hash;
        const qIdx = hash.indexOf('?');
        if (qIdx === -1) return;
        const params = new URLSearchParams(hash.substring(qIdx));
        const subject = params.get('subject');
        const chapter = params.get('chapter');
        if (subject) {
            const el = document.getElementById('ql-subject');
            if (el) el.value = subject;
        }
        if (chapter) {
            const el = document.getElementById('ql-chapter');
            if (el) el.value = chapter;
        }
    }

    initializeTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    getHTML() {
        const userName = this.user?.displayName?.split(' ')[0] || 'Learner';
        const fsPhoto = this.user?.fsData?.photoURL;
        const authPhoto = this.user?.photoURL;
        const avatarUrl = fsPhoto || authPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`;
        const isDark = document.documentElement.classList.contains('dark');

        return `
        <div class="ql-page">
            <!-- Header -->
            <header class="ql-header">
                <div class="ql-header-inner">
                    <div class="ql-header-left">
                        <button id="ql-back-btn" class="ql-icon-btn" aria-label="Go back">
                            <span class="material-icons-round">arrow_back</span>
                        </button>
                        <div class="ql-nav-dropdown-wrap" id="ql-nav-wrap">
                            <button class="ql-brand-btn" id="ql-nav-toggle">
                                <span class="material-icons-round ql-brand-icon">school</span>
                                <span class="ql-brand-text">Wexam</span>
                                <span class="material-icons-round ql-dropdown-arrow">expand_more</span>
                            </button>
                            <div class="ql-nav-dropdown" id="ql-nav-dropdown">
                                <button class="ql-nav-item" data-route="home">
                                    <span class="material-icons-round">menu_book</span>
                                    Dictionary
                                </button>
                                <button class="ql-nav-item active" data-route="quizlab">
                                    <span class="material-icons-round">quiz</span>
                                    QuizLab
                                </button>
                                <button class="ql-nav-item" data-route="resources">
                                    <span class="material-icons-round">folder_open</span>
                                    Resources
                                </button>
                                <button class="ql-nav-item" data-route="performance">
                                    <span class="material-icons-round">insights</span>
                                    Performance
                                </button>
                                <button class="ql-nav-item" data-route="profile">
                                    <span class="material-icons-round">person</span>
                                    Profile
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="ql-header-right">
                        <button id="ql-theme-toggle" class="ql-icon-btn" aria-label="Toggle theme">
                            <span class="material-icons-round">${isDark ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button id="ql-profile-btn" class="ql-avatar-btn" aria-label="Profile">
                            <img src="${avatarUrl}" alt="Profile" class="ql-avatar-img">
                        </button>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="ql-main">
                <!-- Page Title -->
                <div class="ql-page-title-section">
                    <h1 class="ql-page-title">QuizLab</h1>
                    <p class="ql-page-subtitle">Generate AI-powered quizzes from any text or PDF</p>
                </div>

                <div class="ql-content-grid">
                    <!-- Section 1: Upload -->
                    <section class="ql-card ql-upload-card">
                        <div class="ql-card-header">
                            <span class="material-icons-round ql-card-icon">upload_file</span>
                            <h2 class="ql-card-title">Upload Content</h2>
                        </div>

                        <!-- Drag & Drop Zone -->
                        <div class="ql-dropzone" id="ql-dropzone">
                            <div class="ql-dropzone-inner" id="ql-dropzone-inner">
                                <span class="material-icons-round ql-dropzone-icon">cloud_upload</span>
                                <p class="ql-dropzone-text">Drag & drop a PDF here</p>
                                <p class="ql-dropzone-hint">or click to browse · Max 5MB</p>
                                <input type="file" id="ql-file-input" accept=".pdf" class="ql-file-hidden">
                            </div>
                            <div class="ql-dropzone-success hidden" id="ql-dropzone-success">
                                <span class="material-icons-round ql-success-icon">check_circle</span>
                                <p class="ql-success-text" id="ql-file-name">document.pdf</p>
                                <button class="ql-remove-file" id="ql-remove-file">
                                    <span class="material-icons-round">close</span>
                                </button>
                            </div>
                        </div>

                        <!-- OR Divider -->
                        <div class="ql-divider">
                            <span class="ql-divider-text">OR</span>
                        </div>

                        <!-- Paste Text -->
                        <textarea class="ql-textarea" id="ql-text-input" rows="5"
                            placeholder="Paste your study material, notes, or textbook content here..."></textarea>

                        <!-- Meta Selectors -->
                        <div class="ql-meta-grid">
                            <div class="ql-field">
                                <label class="ql-label" for="ql-class">Class</label>
                                <select class="ql-select" id="ql-class">
                                    <option value="">Select Class</option>
                                    <option value="6">Class 6</option>
                                    <option value="7">Class 7</option>
                                    <option value="8">Class 8</option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                    <option value="ug">Undergraduate</option>
                                    <option value="pg">Postgraduate</option>
                                </select>
                            </div>
                            <div class="ql-field">
                                <label class="ql-label" for="ql-subject">Subject</label>
                                <select class="ql-select" id="ql-subject">
                                    <option value="">Select Subject</option>
                                    <option value="physics">Physics</option>
                                    <option value="chemistry">Chemistry</option>
                                    <option value="biology">Biology</option>
                                    <option value="mathematics">Mathematics</option>
                                    <option value="english">English</option>
                                    <option value="history">History</option>
                                    <option value="geography">Geography</option>
                                    <option value="computer-science">Computer Science</option>
                                    <option value="economics">Economics</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="ql-field ql-field-full">
                                <label class="ql-label" for="ql-chapter">Chapter Name</label>
                                <input type="text" class="ql-input" id="ql-chapter" placeholder="e.g., Organic Compounds">
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: Quiz Settings -->
                    <section class="ql-card ql-settings-card">
                        <div class="ql-card-header">
                            <span class="material-icons-round ql-card-icon">tune</span>
                            <h2 class="ql-card-title">Quiz Settings</h2>
                        </div>

                        <!-- Difficulty -->
                        <div class="ql-setting-group">
                            <span class="ql-label" id="ql-diff-label">Difficulty Level</span>
                            <div class="ql-pill-grid" id="ql-difficulty-pills" role="radiogroup" aria-labelledby="ql-diff-label">
                                <button class="ql-pill" data-value="easy">Easy</button>
                                <button class="ql-pill active" data-value="medium">Medium</button>
                                <button class="ql-pill" data-value="hard">Hard</button>
                                <button class="ql-pill ql-pill-hots" data-value="hots">HOTS 🔥</button>
                            </div>
                        </div>

                        <!-- Question Type -->
                        <div class="ql-setting-group">
                            <span class="ql-label" id="ql-type-label">Question Format</span>
                            <div class="ql-pill-row" id="ql-type-pills" role="radiogroup" aria-labelledby="ql-type-label">
                                <button class="ql-pill-sm active" data-value="mcq">MCQ</button>
                                <button class="ql-pill-sm" data-value="short">Short</button>
                                <button class="ql-pill-sm" data-value="long">Long</button>
                                <button class="ql-pill-sm" data-value="mixed">Mixed</button>
                            </div>
                        </div>

                        <!-- Question Count -->
                        <div class="ql-setting-group">
                            <label class="ql-label" for="ql-count-range">Number of Questions</label>
                            <div class="ql-count-section">
                                <div class="ql-count-display">
                                    <span class="ql-count-number" id="ql-count-display">10</span>
                                    <span class="ql-count-label">Qs</span>
                                </div>
                                <input type="range" class="ql-range" id="ql-count-range" 
                                    min="5" max="50" value="10" step="5">
                                <div class="ql-range-labels">
                                    <span>5 MIN</span>
                                    <span>50 MAX</span>
                                </div>
                            </div>
                        </div>

                        <!-- Usage Info -->
                        <div class="ql-usage-info" id="ql-usage-info">
                            <span class="material-icons-round">info</span>
                            <span>Loading usage...</span>
                        </div>
                    </section>
                </div>

                <!-- Generate Button -->
                <div class="ql-generate-section">
                    <button class="ql-generate-btn" id="ql-generate-btn">
                        <span class="ql-generate-text">
                            <span class="material-icons-round">auto_awesome</span>
                            Generate Quiz
                        </span>
                        <span class="ql-generate-loading hidden" id="ql-generate-loading">
                            <span class="ql-spinner"></span>
                            Generating...
                        </span>
                    </button>
                </div>
            </main>
        </div>`;
    }

    addEventListeners() {
        // Back button
        const backBtn = document.getElementById('ql-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.onNavigate('home'));
        }

        // Nav dropdown
        const navToggle = document.getElementById('ql-nav-toggle');
        const navDropdown = document.getElementById('ql-nav-dropdown');
        const navWrap = document.getElementById('ql-nav-wrap');

        if (navToggle && navDropdown) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (navWrap && !navWrap.contains(e.target)) {
                    navDropdown.classList.remove('show');
                }
            });

            navDropdown.querySelectorAll('.ql-nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const route = item.dataset.route;
                    navDropdown.classList.remove('show');
                    if (route === 'home') this.onNavigate('home');
                    else if (route === 'quizlab') { /* already here */ }
                    else if (route === 'resources') toast.show('Resources coming soon!', 'info');
                    else if (route === 'performance' || route === 'profile') {
                        window.location.hash = '#' + route;
                    }
                });
            });
        }

        // Theme toggle
        const themeBtn = document.getElementById('ql-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.theme = isDark ? 'dark' : 'light';
                themeBtn.innerHTML = `<span class="material-icons-round">${isDark ? 'light_mode' : 'dark_mode'}</span>`;
            });
        }

        // Profile button
        const profileBtn = document.getElementById('ql-profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.onNavigate('profile'));
        }

        // Drag & Drop
        const dropzone = document.getElementById('ql-dropzone');
        const fileInput = document.getElementById('ql-file-input');
        const dropzoneInner = document.getElementById('ql-dropzone-inner');
        const dropzoneSuccess = document.getElementById('ql-dropzone-success');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => {
                if (!dropzoneSuccess.classList.contains('hidden')) return;
                fileInput.click();
            });

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.handleFileUpload(file);
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleFileUpload(file);
            });
        }

        // Remove file
        const removeFile = document.getElementById('ql-remove-file');
        if (removeFile) {
            removeFile.addEventListener('click', (e) => {
                e.stopPropagation();
                this.uploadedText = '';
                dropzoneInner.classList.remove('hidden');
                dropzoneSuccess.classList.add('hidden');
                fileInput.value = '';
                const textInput = document.getElementById('ql-text-input');
                if (textInput) textInput.disabled = false;
            });
        }

        // Difficulty pills
        const diffPills = document.getElementById('ql-difficulty-pills');
        if (diffPills) {
            diffPills.querySelectorAll('.ql-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    diffPills.querySelectorAll('.ql-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.difficulty = pill.dataset.value;
                });
            });
        }

        // Type pills
        const typePills = document.getElementById('ql-type-pills');
        if (typePills) {
            typePills.querySelectorAll('.ql-pill-sm').forEach(pill => {
                pill.addEventListener('click', () => {
                    typePills.querySelectorAll('.ql-pill-sm').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.questionType = pill.dataset.value;
                });
            });
        }

        // Count range
        const countRange = document.getElementById('ql-count-range');
        const countDisplay = document.getElementById('ql-count-display');
        if (countRange && countDisplay) {
            countRange.addEventListener('input', () => {
                this.questionCount = parseInt(countRange.value);
                countDisplay.textContent = this.questionCount;
            });
        }

        // Generate button
        const generateBtn = document.getElementById('ql-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateQuiz());
        }

        // Load usage info
        this.loadUsageInfo();
    }

    async handleFileUpload(file) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.show('Please upload a PDF file.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.show('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        const dropzoneInner = document.getElementById('ql-dropzone-inner');
        const dropzoneSuccess = document.getElementById('ql-dropzone-success');
        const fileName = document.getElementById('ql-file-name');
        const textInput = document.getElementById('ql-text-input');

        // Show loading
        dropzoneInner.innerHTML = `
            <span class="ql-spinner"></span>
            <p class="ql-dropzone-text">Extracting text...</p>
        `;

        try {
            // Get token
            if (!auth.currentUser) throw new Error('You must be logged in to upload files.');
            const token = await auth.currentUser.getIdToken();

            // Read file as base64
            const base64 = await this.fileToBase64(file);

            // Send to backend for extraction
            const response = await fetch('/api/extract-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pdfBase64: base64 })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to extract text');
            }

            this.uploadedText = data.text;
            fileName.textContent = `${file.name} (${data.pages} pages)`;
            dropzoneInner.classList.add('hidden');
            dropzoneSuccess.classList.remove('hidden');
            if (textInput) textInput.disabled = true;

            toast.show(`Extracted text from ${data.pages} pages!`, 'success');

        } catch (error) {
            toast.show(error.message || 'Failed to process PDF', 'error');
            // Reset dropzone
            dropzoneInner.innerHTML = `
                <span class="material-icons-round ql-dropzone-icon">cloud_upload</span>
                <p class="ql-dropzone-text">Drag & drop a PDF here</p>
                <p class="ql-dropzone-hint">or click to browse · Max 5MB</p>
            `;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async loadUsageInfo() {
        const usageInfo = document.getElementById('ql-usage-info');
        if (!usageInfo || !this.user) return;

        try {
            const used = await DBService.getQuizUsageToday(this.user.uid);
            const remaining = Math.max(0, 10 - used);
            usageInfo.innerHTML = `
                <span class="material-icons-round">info</span>
                <span>${remaining} quiz generation${remaining !== 1 ? 's' : ''} remaining today</span>
            `;
            if (remaining <= 3) {
                usageInfo.classList.add('ql-usage-warning');
            }
            if (remaining === 0) {
                usageInfo.classList.add('ql-usage-exhausted');
            }
        } catch (e) {
            usageInfo.innerHTML = `
                <span class="material-icons-round">info</span>
                <span>10 generations per day</span>
            `;
        }
    }

    async generateQuiz() {
        if (this.isGenerating) return;

        // Get text
        const textInput = document.getElementById('ql-text-input');
        const text = this.uploadedText || (textInput ? textInput.value.trim() : '');

        if (!text || text.length < 50) {
            toast.show('Please provide at least 50 characters of text or upload a PDF.', 'warning');
            return;
        }

        // Check rate limit (Client side check for better UX)
        try {
            const used = await DBService.getQuizUsageToday(this.user.uid);
            if (used >= 10) {
                toast.show('Daily limit reached (10/day). Try again tomorrow!', 'error');
                return;
            }
        } catch (e) {
            // Continue if rate limit check fails, backend will enforce it
        }

        // Get settings
        this.selectedClass = document.getElementById('ql-class')?.value || '';
        this.selectedSubject = document.getElementById('ql-subject')?.value || '';
        this.chapterName = document.getElementById('ql-chapter')?.value || '';

        // UI: Loading state
        this.isGenerating = true;
        const btn = document.getElementById('ql-generate-btn');
        const btnText = btn?.querySelector('.ql-generate-text');
        const btnLoading = document.getElementById('ql-generate-loading');
        if (btn) btn.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) btnLoading.classList.remove('hidden');

        try {
            // Get token
            if (!auth.currentUser) throw new Error('You must be logged in to generate a quiz.');
            const token = await auth.currentUser.getIdToken();

            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: text,
                    difficulty: this.difficulty,
                    type: this.questionType,
                    count: this.questionCount
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Daily limit reached. Please try again tomorrow.');
                }
                throw new Error(data.error || 'Failed to generate quiz');
            }

            if (!data.questions || data.questions.length === 0) {
                throw new Error('No questions were generated. Try different text.');
            }

            // Save to Firestore
            const quizId = await DBService.saveQuiz(this.user.uid, {
                class: this.selectedClass,
                subject: this.selectedSubject,
                chapter: this.chapterName,
                difficulty: this.difficulty,
                type: this.questionType,
                questions: data.questions
            });

            // Note: Usage is incremented in the backend now!

            // Navigate to quiz screen with data
            toast.show(`${data.questions.length} questions generated!`, 'success');

            // Store quiz data + quizId in sessionStorage for the quiz screen
            sessionStorage.setItem('currentQuiz', JSON.stringify({
                quizId: quizId,
                questions: data.questions,
                difficulty: this.difficulty,
                type: this.questionType,
                subject: this.selectedSubject,
                chapter: this.chapterName,
                class: this.selectedClass
            }));

            this.onNavigate('quiz');

        } catch (error) {
            toast.show(error.message || 'Failed to generate quiz', 'error');
        } finally {
            this.isGenerating = false;
            if (btn) btn.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoading) btnLoading.classList.add('hidden');
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
