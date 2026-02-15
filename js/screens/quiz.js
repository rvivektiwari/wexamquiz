import { toast } from '../utils/toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { DBService } from '../services/db.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class QuizScreen {
    constructor(containerId, user, onNavigate) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onNavigate = onNavigate;

        // Quiz state
        this.quizData = null;
        this.questions = [];
        this.currentIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isSubmitted = false;
        this.timer = null;
        this.timeElapsed = 0;

        // Load quiz from sessionStorage
        const stored = sessionStorage.getItem('currentQuiz');
        if (stored) {
            this.quizData = JSON.parse(stored);
            this.questions = this.quizData.questions || [];
        }
    }

    render() {
        if (!this.questions || this.questions.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.renderQuizFrame();
        this.renderQuestion();
        this.startTimer();
    }

    renderEmptyState() {
        const content = `
            <div class="flex flex-col items-center justify-center text-center py-12">
                <span class="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4">quiz</span>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Quiz Data</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Generate a quiz from QuizLab first to start practicing.</p>
                <button id="ql-quiz-back" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg transition-all">
                    <span class="material-icons-round">arrow_back</span>
                    Go to QuizLab
                </button>
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, {
            onNavigate: this.onNavigate,
            showHeader: false,
            showFooter: false
        });

        this.container.innerHTML = layout.render(`<div class="max-w-xl mx-auto mt-20">${Card(content)}</div>`);
        layout.postRender();

        document.getElementById('ql-quiz-back')?.addEventListener('click', () => this.onNavigate('quizlab'));
    }

    renderQuizFrame() {
        const subjectLabel = this.quizData.subject ? this.quizData.subject.toUpperCase().replace('-', ' ') : 'QUIZ';
        const chapterLabel = this.quizData.chapter || 'Practice Quiz';

        // Minimal Layout with Header/Footer hidden
        // We implement our own "Quiz Header" inside the Layout's main content
        const layout = new Layout(this.containerId, this.user, {
            onNavigate: this.onNavigate,
            showHeader: false,
            showFooter: false
        });

        // Quiz UI Wrapper
        const innerHtml = `
            <div class="flex flex-col h-screen h-[100dvh]">
                <!-- Quiz Header -->
                <header class="flex-none px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-50">
                    <div class="max-w-4xl mx-auto">
                        <div class="flex items-center justify-between mb-4">
                            <button id="quiz-close" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400" aria-label="Close quiz">
                                <span class="material-icons-round">close</span>
                            </button>
                            
                            <div class="flex flex-col items-center">
                                <span class="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">${escapeHtml(subjectLabel)}</span>
                                <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">${escapeHtml(chapterLabel)}</span>
                            </div>

                            <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                <span class="material-icons-round text-gray-500 text-lg">timer</span>
                                <span class="font-mono text-sm font-bold text-gray-900 dark:text-white" id="quiz-timer-text">00:00</span>
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div id="quiz-progress-fill" class="bg-brand-500 h-full transition-all duration-300 ease-out" style="width: 0%"></div>
                        </div>
                        <div class="flex justify-between items-center mt-1.5 text-xs text-gray-500 font-medium">
                            <span id="quiz-progress-text">Question 1 of ${this.questions.length}</span>
                            <span id="quiz-progress-pct">0%</span>
                        </div>
                    </div>
                </header>

                <!-- Question Area (Scrollable) -->
                <main class="flex-grow overflow-y-auto px-4 py-8" id="quiz-main-scroll">
                    <div class="max-w-3xl mx-auto" id="quiz-main">
                        <!-- Question Content -->
                    </div>
                </main>

                <!-- Footer / Nav -->
                <footer class="flex-none px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50">
                    <div class="max-w-4xl mx-auto flex items-center justify-between">
                         <button id="quiz-prev" class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="material-icons-round">chevron_left</span>
                        </button>

                        <button id="quiz-submit-btn" class="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            <span>Submit Answer</span>
                            <span class="material-icons-round">arrow_forward</span>
                        </button>

                        <button id="quiz-next" class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="material-icons-round">navigate_next</span>
                        </button>
                    </div>
                </footer>
            </div>
        `;

        this.container.innerHTML = layout.render(innerHtml);

        // Remove padding from main layout container for this screen only to make it full height properly? 
        // Layout.js adds `pt-8 pb-20`. 
        // We might want to override this.
        // But since we are rendering inside `main` of Layout, `h-screen` in innerHtml won't break out of the padding.
        // It's acceptable for now; it sits inside the "Desktop" frame. 
        // Actually, for a quiz, full viewport is better.
        // Given I'm using "minimal" mode by hiding header/footer, the padding remains.
        // I can just style `quiz-main-scroll` to fit the available space. 

        layout.postRender();
        this.addEventListeners();
    }

    renderQuestion() {
        const main = document.getElementById('quiz-main');
        if (!main) return;

        const q = this.questions[this.currentIndex];
        if (!q) return;

        const qType = q.type || this.quizData.type || 'mcq';
        const diffLabel = (this.quizData.difficulty || 'medium').toUpperCase();

        let diffColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        if (this.quizData.difficulty === 'hard' || this.quizData.difficulty === 'hots') diffColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        if (this.quizData.difficulty === 'easy') diffColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

        let questionContentHTML = '';

        const badge = `<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-4 ${diffColor}">● ${diffLabel}</span>`;
        const questionText = `<h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed mb-8">${escapeHtml(q.question)}</h2>`;

        if (qType === 'mcq' || (q.options && q.options.length > 0)) {
            const selectedAnswer = this.answers[this.currentIndex];
            const optionsHTML = `
                <div class="space-y-3" role="radiogroup">
                    ${q.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === q.answer;
                const isWrong = isSelected && !isCorrect;

                let baseClasses = "relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group";
                let stateClasses = "border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-gray-800";
                let dotClasses = "border-gray-300 dark:border-gray-600 group-hover:border-brand-500";

                if (this.isSubmitted) {
                    baseClasses += " cursor-default";
                    if (isCorrect) {
                        stateClasses = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                        dotClasses = "border-emerald-500 bg-emerald-500";
                    } else if (isWrong) {
                        stateClasses = "border-red-500 bg-red-50 dark:bg-red-900/20";
                        dotClasses = "border-red-500 bg-red-500";
                    } else {
                        stateClasses = "border-gray-200 dark:border-gray-700 opacity-50";
                    }
                } else if (isSelected) {
                    stateClasses = "border-brand-600 bg-brand-50 dark:bg-brand-900/20";
                    dotClasses = "border-brand-600 bg-brand-600";
                }

                return `
                        <div class="quiz-option ${baseClasses} ${stateClasses}" role="radio" aria-checked="${isSelected}" tabindex="0" data-index="${i}">
                             <div class="w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${dotClasses}">
                                ${isSelected || (this.isSubmitted && isCorrect) ? '<div class="w-2.5 h-2.5 rounded-full bg-white"></div>' : ''}
                             </div>
                             <span class="flex-1 text-gray-700 dark:text-gray-200 font-medium">${escapeHtml(opt)}</span>
                             ${this.isSubmitted && isCorrect ? '<span class="material-icons-round text-emerald-500 ml-2">check_circle</span>' : ''}
                             ${this.isSubmitted && isWrong ? '<span class="material-icons-round text-red-500 ml-2">cancel</span>' : ''}
                        </div>`;
            }).join('')}
                </div>
            `;
            questionContentHTML = optionsHTML;
        } else {
            // Short/Long answer
            const isLong = qType === 'long';
            const currentAnswer = this.answers[this.currentIndex] || '';
            const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
            const targetWords = isLong ? 150 : 50;
            const marks = isLong ? '5 Marks' : '3 Marks';
            const timeGuide = isLong ? '4-5 mins' : '2-3 mins';

            questionContentHTML = `
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div class="flex items-center gap-1">
                        <span class="material-icons-round text-base">stars</span>
                        <span>${marks}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="material-icons-round text-base">schedule</span>
                        <span>${timeGuide}</span>
                    </div>
                </div>

                <textarea id="quiz-answer-input" 
                    class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                    rows="${isLong ? 10 : 5}" 
                    placeholder="Type your answer here..."
                    ${this.isSubmitted ? 'readonly' : ''}
                >${escapeHtml(currentAnswer)}</textarea>

                <div class="flex justify-end mt-2 text-xs font-mono text-gray-500">
                    <span id="quiz-word-count">${wordCount}</span> / ${targetWords} words
                </div>

                ${this.isSubmitted ? `
                    <div class="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                        <span class="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2 block">Model Answer</span>
                        <p class="text-gray-800 dark:text-gray-200 leading-relaxed">${escapeHtml(q.answer)}</p>
                    </div>
                ` : ''}
            `;
        }

        // Wrap content in Card
        main.innerHTML = Card(`${badge}${questionText}${questionContentHTML}`, "p-6 md:p-8 min-h-[400px]");

        this.updateProgress();
        this.attachQuestionListeners(qType);

        // Update nav buttons
        const prevBtn = document.getElementById('quiz-prev');
        const nextBtn = document.getElementById('quiz-next');
        const submitBtn = document.getElementById('quiz-submit-btn');

        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) {
            nextBtn.style.display = 'flex'; // Ensure visible
            // If last question, maybe hide next button and rely on Submit?
            // Or keep it for navigation if already submitted.
            if (!this.isSubmitted && this.currentIndex === this.questions.length - 1) {
                nextBtn.disabled = true; // Can't go next beyond last
            } else {
                nextBtn.disabled = this.currentIndex === this.questions.length - 1;
            }
        }

        if (submitBtn) {
            // "Submit Answer" text changes based on context
            const spanText = submitBtn.querySelector('span:first-child');
            if (this.isSubmitted) {
                if (this.currentIndex === this.questions.length - 1) {
                    spanText.textContent = "Finish Review";
                } else {
                    spanText.textContent = "Next Question";
                }
            } else {
                if (this.currentIndex === this.questions.length - 1) {
                    spanText.textContent = "Submit Quiz";
                } else {
                    spanText.textContent = "Next Question";
                }
            }
        }
    }

    attachQuestionListeners(qType) {
        if (qType === 'mcq' || (this.questions[this.currentIndex]?.options?.length > 0)) {
            this.container.querySelectorAll('.quiz-option').forEach((opt, i) => {
                opt.addEventListener('click', () => {
                    if (this.isSubmitted) return;
                    const q = this.questions[this.currentIndex];
                    this.answers[this.currentIndex] = q.options[i];
                    this.renderQuestion();
                });
            });
        } else {
            const answerInput = document.getElementById('quiz-answer-input');
            if (answerInput) {
                answerInput.addEventListener('input', () => {
                    this.answers[this.currentIndex] = answerInput.value;
                    const wordCount = answerInput.value.trim() ? answerInput.value.trim().split(/\s+/).length : 0;
                    const wcEl = document.getElementById('quiz-word-count');
                    if (wcEl) wcEl.textContent = wordCount;
                });
            }
        }
    }

    updateProgress() {
        const pct = Math.round(((this.currentIndex + 1) / this.questions.length) * 100);
        const fill = document.getElementById('quiz-progress-fill');
        const text = document.getElementById('quiz-progress-text');
        const pctText = document.getElementById('quiz-progress-pct');

        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
        if (pctText) pctText.textContent = `${pct}%`;
    }

    addEventListeners() {
        document.getElementById('quiz-close')?.addEventListener('click', () => {
            if (this.isSubmitted || confirm('Are you sure you want to exit? Your progress will be lost.')) {
                this.stopTimer();
                this.onNavigate('quizlab');
            }
        });

        document.getElementById('quiz-prev')?.addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.renderQuestion();
            }
        });

        document.getElementById('quiz-next')?.addEventListener('click', () => {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this.renderQuestion();
            }
        });

        document.getElementById('quiz-submit-btn')?.addEventListener('click', () => {
            if (this.isSubmitted) {
                // In review mode, this acts as "Next" or "Finish"
                if (this.currentIndex < this.questions.length - 1) {
                    this.currentIndex++;
                    this.renderQuestion();
                } else {
                    this.onNavigate('quizlab');
                }
            } else {
                // In taking mode
                if (this.currentIndex < this.questions.length - 1) {
                    // Just move next? Or force answer? 
                    // Let's assume standard behavior: Next
                    this.currentIndex++;
                    this.renderQuestion();
                } else {
                    // Submit Quiz
                    this.handleSubmit();
                }
            }
        });
    }

    startTimer() {
        this.timeElapsed = 0;
        this.timer = setInterval(() => {
            if (this.isSubmitted) return;
            this.timeElapsed++;
            const mins = Math.floor(this.timeElapsed / 60).toString().padStart(2, '0');
            const secs = (this.timeElapsed % 60).toString().padStart(2, '0');
            const timerText = document.getElementById('quiz-timer-text');
            if (timerText) timerText.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async handleSubmit() {
        this.stopTimer();
        this.isSubmitted = true;

        // Calculate Score
        let correct = 0;
        let total = 0;
        this.questions.forEach((q, i) => {
            if (q.type === 'mcq' || (q.options && q.options.length > 0)) {
                total++;
                if (this.answers[i] === q.answer) {
                    correct++;
                }
            }
        });

        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

        // Save
        try {
            if (this.user && this.user.uid) {
                await DBService.saveQuizResult(this.user.uid, {
                    quizId: this.quizData.quizId || null,
                    score: pct,
                    total: total,
                    correct: correct,
                    wrong: total - correct,
                    timeElapsed: this.timeElapsed,
                    subject: this.quizData.subject || '',
                    chapter: this.quizData.chapter || '',
                    difficulty: this.quizData.difficulty || '',
                    type: this.quizData.type || ''
                });
            }
        } catch (err) {
            console.error(err);
        }

        this.showResults(pct, correct, total);
    }

    showResults(pct, correct, total) {
        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;

        const resultsContent = `
            <div class="flex flex-col items-center text-center">
                <div class="mb-6 relative">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                         <circle cx="80" cy="80" r="70" fill="none" class="stroke-gray-200 dark:stroke-gray-700" stroke-width="12" />
                         <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"
                            stroke-dasharray="${Math.round(2 * Math.PI * 70)}"
                            stroke-dashoffset="${Math.round(2 * Math.PI * 70 * (1 - pct / 100))}"
                            class="text-brand-500 transform -rotate-90 origin-center transition-all duration-1000" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-4xl font-bold text-gray-900 dark:text-white">${pct}%</span>
                        <span class="text-2xl font-bold text-gray-500 dark:text-gray-400">${grade}</span>
                    </div>
                </div>

                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">Great job! Review your answers below or start a new quiz to keep practicing.</p>

                <div class="grid grid-cols-3 gap-4 w-full mb-8">
                    <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                        <span class="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">${correct}</span>
                        <span class="text-xs font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70">Correct</span>
                    </div>
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                         <span class="block text-2xl font-bold text-red-600 dark:text-red-400">${total - correct}</span>
                         <span class="text-xs font-bold uppercase text-red-600/70 dark:text-red-400/70">Wrong</span>
                    </div>
                    <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                         <span class="block text-2xl font-bold text-gray-900 dark:text-white">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                         <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Time</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-4 w-full">
                    <button id="res-review-btn" class="flex-1 py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Review Answers
                    </button>
                    <button id="res-new-btn" class="flex-1 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors shadow-lg shadow-brand-500/30">
                        New Quiz
                    </button>
                </div>
            </div>
        `;

        const main = document.getElementById('quiz-main');
        if (main) main.innerHTML = Card(resultsContent, "p-8 max-w-lg mx-auto");

        // Hide nav buttons
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';

        // Listeners
        document.getElementById('res-review-btn')?.addEventListener('click', () => {
            if (footer) footer.style.display = 'block'; // Show footer again for review
            this.currentIndex = 0;
            this.renderQuestion();
        });

        document.getElementById('res-new-btn')?.addEventListener('click', () => {
            sessionStorage.removeItem('currentQuiz');
            this.onNavigate('quizlab');
        });

        if (pct >= 90) this.showConfetti();
    }

    showConfetti() {
        // Simple confetti implementation or placeholder
        // Re-using the simplified one from previous file
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * 5 + 2,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < canvas.height) {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 6, 6);
                    active = true;
                }
            });
            if (active) requestAnimationFrame(animate);
            else canvas.remove();
        }
        animate();
    }

    destroy() {
        this.stopTimer();
    }
}
