import { DBService } from '../services/db.js';
import { toast } from '../utils/toast.js';
import { auth } from '../config/firebase-config.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class QuizLabScreen {
    constructor(containerId, user, onNavigate) {
        this.containerId = containerId;
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
        // isDragOver tracked via class
    }

    render() {
        this.applyUrlPrefill(); // Helper to get initial values

        // Section 1: Upload
        const uploadContent = `
            <div class="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <span class="material-icons-round">upload_file</span>
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upload Content</h2>
            </div>

            <!-- Drag & Drop Zone -->
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center transition-all hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 cursor-pointer group" id="ql-dropzone">
                <div class="flex flex-col items-center gap-3" id="ql-dropzone-inner">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span class="material-icons-round text-gray-400 group-hover:text-brand-500 transition-colors">cloud_upload</span>
                    </div>
                    <div>
                        <p class="font-medium text-gray-700 dark:text-gray-300">Drag & drop a PDF here</p>
                        <p class="text-xs text-gray-500 mt-1">or click to browse · Max 5MB</p>
                    </div>
                    <input type="file" id="ql-file-input" accept=".pdf" class="hidden">
                </div>
                
                <div class="flex flex-col items-center gap-3 hidden" id="ql-dropzone-success">
                    <span class="material-icons-round text-green-500 text-4xl">check_circle</span>
                    <p class="font-medium text-gray-900 dark:text-white" id="ql-file-name">document.pdf</p>
                    <button class="text-xs text-red-500 hover:underline flex items-center gap-1" id="ql-remove-file">
                        <span class="material-icons-round text-sm">close</span> Remove
                    </button>
                </div>
            </div>

            <!-- OR Divider -->
            <div class="flex items-center gap-4 py-6">
                <div class="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">OR</span>
                <div class="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            </div>

            <!-- Paste Text -->
            <textarea id="ql-text-input" rows="5"
                class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none"
                placeholder="Paste your study material, notes, or textbook content here..."></textarea>

            <!-- Meta Selectors -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Class</label>
                    <select id="ql-class" class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none">
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
                <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Subject</label>
                    <select id="ql-subject" class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none">
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
                <div class="space-y-1 md:col-span-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Chapter Name</label>
                    <input type="text" id="ql-chapter" class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="e.g., Organic Compounds">
                </div>
            </div>
        `;

        // Section 2: Settings
        const settingsContent = `
            <div class="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <span class="material-icons-round">tune</span>
                </div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Quiz Settings</h2>
            </div>

            <!-- Difficulty -->
            <div class="mb-6">
                <span class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">Difficulty Level</span>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2" id="ql-difficulty-pills">
                    <button class="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm font-medium transition-all" data-value="easy">Easy</button>
                    <button class="py-2 px-3 rounded-lg border border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium text-sm transition-all shadow-sm active" data-value="medium">Medium</button>
                    <button class="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm font-medium transition-all" data-value="hard">Hard</button>
                    <button class="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-all" data-value="hots">HOTS 🔥</button>
                </div>
            </div>

            <!-- Question Type -->
            <div class="mb-6">
                <span class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 ml-1">Question Format</span>
                <div class="flex flex-wrap gap-2" id="ql-type-pills">
                    <button class="py-1.5 px-4 rounded-full border border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wide transition-all shadow-sm active" data-value="mcq">MCQ</button>
                    <button class="py-1.5 px-4 rounded-full border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide transition-all" data-value="short">Short</button>
                    <button class="py-1.5 px-4 rounded-full border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide transition-all" data-value="long">Long</button>
                    <button class="py-1.5 px-4 rounded-full border border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wide transition-all" data-value="mixed">Mixed</button>
                </div>
            </div>

            <!-- Question Count -->
            <div class="mb-2">
                <div class="flex justify-between items-end mb-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">Number of Questions</label>
                    <div class="flex items-baseline text-brand-600 dark:text-brand-400 font-bold">
                        <span class="text-xl" id="ql-count-display">10</span>
                        <span class="text-xs ml-1">Qs</span>
                    </div>
                </div>
                <input type="range" id="ql-count-range" min="5" max="50" value="10" step="5" class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600">
                <div class="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
                    <span>5 MIN</span>
                    <span>50 MAX</span>
                </div>
            </div>

            <!-- Usage Info -->
            <div class="mt-6 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg" id="ql-usage-info">
                <span class="material-icons-round text-sm">info</span>
                <span>Loading usage...</span>
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, {
            onNavigate: (route) => {
                this.onNavigate(route); // Delegate to App controller
            },
            onLogout: () => auth.signOut()
        });

        const finalHtml = `
            <div class="flex flex-col gap-8 max-w-5xl mx-auto">
                <!-- Page Title -->
                <div class="text-center md:text-left">
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">QuizLab</h1>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Generate AI-powered quizzes from any text or PDF</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <!-- Left: Upload -->
                    ${Card(uploadContent)}

                    <!-- Right: Settings -->
                     ${Card(settingsContent)}
                </div>

                <!-- Generate Button -->
                <div class="flex justify-center pb-8">
                    <button id="ql-generate-btn" class="group relative inline-flex items-center gap-3 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 transform hover:-translate-y-1 transition-all duration-300 text-lg">
                        <span class="material-icons-round transition-transform group-hover:rotate-12">auto_awesome</span>
                        <span class="ql-generate-text">Generate Quiz</span>
                        <span class="ql-generate-loading hidden flex items-center gap-2">
                             <span class="material-icons-round animate-spin">sync</span> Generating...
                        </span>
                        <div class="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                    </button>
                </div>
            </div>
        `;

        this.container.innerHTML = layout.render(finalHtml);
        layout.postRender();
        this.addEventListeners();

        // Re-apply prefill references if needed
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        if (urlParams.get('subject')) document.getElementById('ql-subject').value = urlParams.get('subject');
        if (urlParams.get('chapter')) document.getElementById('ql-chapter').value = urlParams.get('chapter');
    }

    applyUrlPrefill() {
        const hash = window.location.hash;
        if (!hash.includes('?')) return;
        // logic moved to post-render
    }

    addEventListeners() {
        // Drag & Drop
        const dropzone = document.getElementById('ql-dropzone');
        const fileInput = document.getElementById('ql-file-input');
        const dropzoneSuccess = document.getElementById('ql-dropzone-success');
        const dropzoneInner = document.getElementById('ql-dropzone-inner');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => {
                if (!dropzoneSuccess.classList.contains('hidden')) return;
                fileInput.click();
            });

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-brand-500', 'bg-brand-50/20');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-brand-500', 'bg-brand-50/20');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-brand-500', 'bg-brand-50/20');
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
            diffPills.querySelectorAll('button').forEach(pill => {
                pill.addEventListener('click', () => {
                    // Reset styling
                    diffPills.querySelectorAll('button').forEach(p => {
                        p.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400', 'active', 'shadow-sm');
                        p.classList.add('border-gray-200', 'dark:border-gray-700');
                    });

                    // Add active styling
                    pill.classList.remove('border-gray-200', 'dark:border-gray-700');
                    pill.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400', 'active', 'shadow-sm');

                    this.difficulty = pill.dataset.value;
                });
            });
        }

        // Type pills
        const typePills = document.getElementById('ql-type-pills');
        if (typePills) {
            typePills.querySelectorAll('button').forEach(pill => {
                pill.addEventListener('click', () => {
                    typePills.querySelectorAll('button').forEach(p => {
                        p.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400', 'active', 'shadow-sm');
                        p.classList.add('border-gray-200', 'dark:border-gray-700');
                    });
                    pill.classList.remove('border-gray-200', 'dark:border-gray-700');
                    pill.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20', 'text-brand-600', 'dark:text-brand-400', 'active', 'shadow-sm');
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

        // Show loading in dropzone
        const originalContent = dropzoneInner.innerHTML;
        dropzoneInner.innerHTML = `
            <span class="material-icons-round animate-spin text-brand-600 text-3xl">sync</span>
            <p class="font-medium text-gray-700 dark:text-gray-300 mt-2">Extracting text...</p>
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

            // Restore dropzone html then hide it
            dropzoneInner.innerHTML = originalContent;
            dropzoneInner.classList.add('hidden');
            dropzoneSuccess.classList.remove('hidden');
            if (textInput) textInput.disabled = true;

            toast.show(`Extracted text from ${data.pages} pages!`, 'success');

        } catch (error) {
            toast.show(error.message || 'Failed to process PDF', 'error');
            // Reset dropzone
            dropzoneInner.innerHTML = originalContent;
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
                <span class="material-icons-round text-sm">info</span>
                <span>${remaining} quiz generation${remaining !== 1 ? 's' : ''} remaining today</span>
            `;
            if (remaining <= 3) {
                usageInfo.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-500');
                usageInfo.classList.add('bg-orange-50', 'dark:bg-orange-900/20', 'text-orange-600', 'dark:text-orange-400');
            }
            if (remaining === 0) {
                usageInfo.classList.remove('bg-orange-50', 'dark:bg-orange-900/20', 'text-orange-600', 'dark:text-orange-400');
                usageInfo.classList.add('bg-red-50', 'dark:bg-red-900/20', 'text-red-600', 'dark:text-red-400');
            }
        } catch (e) {
            usageInfo.innerHTML = `
                <span class="material-icons-round text-sm">info</span>
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

        // Check rate limit (Client side check)
        try {
            const used = await DBService.getQuizUsageToday(this.user.uid);
            if (used >= 10) {
                toast.show('Daily limit reached (10/day). Try again tomorrow!', 'error');
                return;
            }
        } catch (e) {
            // Allow
        }

        // Get settings
        this.selectedClass = document.getElementById('ql-class')?.value || '';
        this.selectedSubject = document.getElementById('ql-subject')?.value || '';
        this.chapterName = document.getElementById('ql-chapter')?.value || '';

        // UI: Loading state
        this.isGenerating = true;
        const btn = document.getElementById('ql-generate-btn');
        const btnText = btn?.querySelector('.ql-generate-text');
        const btnLoading = btn?.querySelector('.ql-generate-loading');

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
}
