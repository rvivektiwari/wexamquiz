import { toast } from '../utils/toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { DBService } from '../services/db.js';

export class QuizScreen {
    constructor(containerId, user, onNavigate) {
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
            this.container.innerHTML = this.getEmptyState();
            document.getElementById('ql-quiz-back')?.addEventListener('click', () => this.onNavigate('quizlab'));
            return;
        }

        this.container.innerHTML = this.getQuizHTML();
        this.renderQuestion();
        this.addEventListeners();
        this.startTimer();
    }

    getEmptyState() {
        return `
        <div class="ql-page">
            <div class="quiz-empty-state">
                <span class="material-icons-round quiz-empty-icon">quiz</span>
                <h2>No Quiz Data</h2>
                <p>Generate a quiz from QuizLab first.</p>
                <button class="ql-generate-btn" id="ql-quiz-back" style="max-width:300px;margin-top:1.5rem;">
                    <span class="ql-generate-text">
                        <span class="material-icons-round">arrow_back</span>
                        Go to QuizLab
                    </span>
                </button>
            </div>
        </div>`;
    }

    getQuizHTML() {
        const subjectLabel = this.quizData.subject ? this.quizData.subject.toUpperCase().replace('-', ' ') : 'QUIZ';
        const chapterLabel = this.quizData.chapter || 'Practice Quiz';
        const diffLabel = (this.quizData.difficulty || 'medium').toUpperCase();

        return `
        <div class="ql-page">
            <!-- Quiz Header -->
            <header class="quiz-header">
                <div class="quiz-header-inner">
                    <button class="ql-icon-btn quiz-close-btn" id="quiz-close">
                        <span class="material-icons-round">close</span>
                    </button>
                    <div class="quiz-header-center">
                        <span class="quiz-subject-label">${escapeHtml(subjectLabel)}</span>
                        <span class="quiz-chapter-label">${escapeHtml(chapterLabel)}</span>
                    </div>
                    <div class="quiz-timer" id="quiz-timer">
                        <span class="material-icons-round quiz-timer-icon">timer</span>
                        <span class="quiz-timer-text" id="quiz-timer-text">00:00</span>
                    </div>
                </div>
                <!-- Progress Bar -->
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" id="quiz-progress-fill" style="width: 0%"></div>
                </div>
                <div class="quiz-progress-info">
                    <span id="quiz-progress-text">Question 1 of ${this.questions.length}</span>
                    <span id="quiz-progress-pct">0%</span>
                </div>
            </header>

            <!-- Question Area -->
            <main class="quiz-main" id="quiz-main">
                <!-- Question content will be rendered here -->
            </main>

            <!-- Bottom Navigation -->
            <footer class="quiz-footer">
                <button class="quiz-nav-btn quiz-prev-btn" id="quiz-prev">
                    <span class="material-icons-round">chevron_left</span>
                </button>
                <button class="quiz-submit-btn" id="quiz-submit-btn">
                    <span class="quiz-submit-text">Submit Answer</span>
                    <span class="material-icons-round">arrow_forward</span>
                </button>
                <button class="quiz-nav-btn quiz-next-btn" id="quiz-next">
                    <span class="material-icons-round">skip_next</span>
                </button>
            </footer>
        </div>`;
    }

    renderQuestion() {
        const main = document.getElementById('quiz-main');
        if (!main) return;

        const q = this.questions[this.currentIndex];
        if (!q) return;

        const qType = q.type || this.quizData.type || 'mcq';
        const diffLabel = (this.quizData.difficulty || 'medium').toUpperCase();
        const diffClass = this.getDifficultyClass(this.quizData.difficulty);

        let questionHTML = '';

        if (qType === 'mcq') {
            questionHTML = this.renderMCQ(q, diffLabel, diffClass);
        } else if (qType === 'short') {
            questionHTML = this.renderShortAnswer(q, diffLabel, diffClass);
        } else if (qType === 'long') {
            questionHTML = this.renderLongAnswer(q, diffLabel, diffClass);
        } else {
            // Mixed or HOTS — determine by presence of options
            if (q.options && q.options.length > 0) {
                questionHTML = this.renderMCQ(q, diffLabel, diffClass);
            } else {
                questionHTML = this.renderShortAnswer(q, diffLabel, diffClass);
            }
        }

        main.innerHTML = questionHTML;
        this.updateProgress();
        this.attachQuestionListeners(qType);
    }

    renderMCQ(q, diffLabel, diffClass) {
        const selectedAnswer = this.answers[this.currentIndex];
        return `
        <div class="quiz-question-card">
            <span class="quiz-diff-badge ${diffClass}">● ${diffLabel}</span>
            <h2 class="quiz-question-text">${escapeHtml(q.question)}</h2>
            <div class="quiz-options" role="radiogroup">
                ${q.options.map((opt, i) => `
                    <div class="quiz-option ${selectedAnswer === opt ? 'selected' : ''} ${this.isSubmitted ? (opt === q.answer ? 'correct' : (selectedAnswer === opt ? 'wrong' : '')) : ''}" role="radio" aria-checked="${selectedAnswer === opt}" tabindex="0">
                        <div class="quiz-radio ${selectedAnswer === opt ? 'checked' : ''}">
                            ${selectedAnswer === opt ? '<div class="quiz-radio-dot"></div>' : ''}
                        </div>
                        <span class="quiz-option-text">${escapeHtml(opt)}</span>
                        ${this.isSubmitted && opt === q.answer ? '<span class="material-icons-round quiz-correct-icon">check_circle</span>' : ''}
                        ${this.isSubmitted && selectedAnswer === opt && opt !== q.answer ? '<span class="material-icons-round quiz-wrong-icon">cancel</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    renderShortAnswer(q, diffLabel, diffClass) {
        const currentAnswer = this.answers[this.currentIndex] || '';
        const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
        return `
        <div class="quiz-question-card">
            <span class="quiz-diff-badge ${diffClass}">● ${diffLabel}</span>
            <div class="quiz-marks-info">
                <span class="material-icons-round">stars</span>
                <span>3 Marks</span>
                <span class="material-icons-round" style="margin-left:0.5rem">schedule</span>
                <span>2-3 mins</span>
            </div>
            <h2 class="quiz-question-text">${escapeHtml(q.question)}</h2>
            <textarea class="quiz-textarea" id="quiz-answer-input" rows="4" 
                placeholder="Type your answer here...">${escapeHtml(currentAnswer)}</textarea>
            <div class="quiz-word-count">
                <span>TARGET: ~50 WORDS</span>
                <span id="quiz-word-count">${wordCount} / 50</span>
            </div>
            ${this.isSubmitted ? `
                <div class="quiz-model-answer">
                    <span class="quiz-model-label">Model Answer:</span>
                    <p>${escapeHtml(q.answer)}</p>
                </div>
            ` : ''}
        </div>`;
    }

    renderLongAnswer(q, diffLabel, diffClass) {
        const currentAnswer = this.answers[this.currentIndex] || '';
        const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
        return `
        <div class="quiz-question-card">
            <span class="quiz-diff-badge ${diffClass}">● ${diffLabel}</span>
            <div class="quiz-marks-info">
                <span class="material-icons-round">stars</span>
                <span>5 Marks</span>
                <span class="material-icons-round" style="margin-left:0.5rem">schedule</span>
                <span>4-5 mins</span>
            </div>
            <h2 class="quiz-question-text">${escapeHtml(q.question)}</h2>
            <textarea class="quiz-textarea quiz-textarea-long" id="quiz-answer-input" rows="8" 
                placeholder="Type your reasoning here...">${escapeHtml(currentAnswer)}</textarea>
            <div class="quiz-textarea-toolbar">
                <button class="quiz-format-btn"><b>B</b></button>
                <button class="quiz-format-btn"><i>I</i></button>
                <button class="quiz-format-btn"><span class="material-icons-round" style="font-size:16px">format_list_bulleted</span></button>
            </div>
            <div class="quiz-word-count">
                <span>TARGET: ~150 WORDS</span>
                <span id="quiz-word-count">${wordCount} / 150</span>
            </div>
            ${this.isSubmitted ? `
                <div class="quiz-model-answer">
                    <span class="quiz-model-label">Model Answer:</span>
                    <p>${escapeHtml(q.answer)}</p>
                </div>
            ` : ''}
        </div>`;
    }

    getDifficultyClass(diff) {
        switch ((diff || '').toLowerCase()) {
            case 'easy': return 'diff-easy';
            case 'medium': return 'diff-medium';
            case 'hard': return 'diff-hard';
            case 'hots': return 'diff-hots';
            default: return 'diff-medium';
        }
    }

    attachQuestionListeners(qType) {
        if (qType === 'mcq' || (this.questions[this.currentIndex]?.options?.length > 0)) {
            // MCQ option selection
            document.querySelectorAll('.quiz-option').forEach((opt, i) => {
                opt.addEventListener('click', () => {
                    if (this.isSubmitted) return;
                    const q = this.questions[this.currentIndex];
                    this.answers[this.currentIndex] = q.options[i];
                    this.renderQuestion(); // Re-render to show selection
                });
            });
        } else {
            // Text input
            const answerInput = document.getElementById('quiz-answer-input');
            if (answerInput) {
                answerInput.addEventListener('input', () => {
                    this.answers[this.currentIndex] = answerInput.value;
                    const wordCount = answerInput.value.trim() ? answerInput.value.trim().split(/\s+/).length : 0;
                    const wcEl = document.getElementById('quiz-word-count');
                    if (wcEl) {
                        const target = qType === 'long' ? 150 : 50;
                        wcEl.textContent = `${wordCount} / ${target}`;
                    }
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
        // Close button
        document.getElementById('quiz-close')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                this.stopTimer();
                this.onNavigate('quizlab');
            }
        });

        // Previous
        document.getElementById('quiz-prev')?.addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.renderQuestion();
            }
        });

        // Next / Skip
        document.getElementById('quiz-next')?.addEventListener('click', () => {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this.renderQuestion();
            }
        });

        // Submit
        document.getElementById('quiz-submit-btn')?.addEventListener('click', () => {
            this.handleSubmit();
        });
    }

    handleSubmit() {
        // If last question or all answered, show results
        if (this.currentIndex === this.questions.length - 1) {
            this.showResults();
            return;
        }

        // Move to next question
        this.currentIndex++;
        this.renderQuestion();
    }

    async showResults() {
        this.stopTimer();
        this.isSubmitted = true;

        // Calculate MCQ score
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
        const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

        // Save result to Firestore
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
            // Don't block results display if save fails
        }

        const main = document.getElementById('quiz-main');
        if (!main) return;

        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;

        main.innerHTML = `
        <div class="quiz-results-card">
            <div class="quiz-results-header">
                <span class="material-icons-round quiz-results-icon">emoji_events</span>
                <h2 class="quiz-results-title">Quiz Complete!</h2>
            </div>

            <div class="quiz-score-circle">
                <div class="quiz-score-ring" style="--score: ${pct}">
                    <span class="quiz-score-pct">${pct}%</span>
                    <span class="quiz-score-grade">${grade}</span>
                </div>
            </div>

            <div class="quiz-results-stats">
                <div class="quiz-stat">
                    <span class="quiz-stat-value">${correct}</span>
                    <span class="quiz-stat-label">Correct</span>
                </div>
                <div class="quiz-stat">
                    <span class="quiz-stat-value">${total - correct}</span>
                    <span class="quiz-stat-label">Wrong</span>
                </div>
                <div class="quiz-stat">
                    <span class="quiz-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                    <span class="quiz-stat-label">Time</span>
                </div>
            </div>

            <div class="quiz-results-actions">
                <button class="quiz-review-btn" id="quiz-review-btn">
                    <span class="material-icons-round">visibility</span>
                    Review Answers
                </button>
                <button class="ql-generate-btn" id="quiz-new-btn" style="max-width:300px">
                    <span class="ql-generate-text">
                        <span class="material-icons-round">refresh</span>
                        New Quiz
                    </span>
                </button>
            </div>
        </div>`;

        // Confetti on 90%+ score
        if (pct >= 90) this.showConfetti();

        // Event listeners for result actions
        document.getElementById('quiz-review-btn')?.addEventListener('click', () => {
            this.currentIndex = 0;
            this.renderQuestion();
        });

        document.getElementById('quiz-new-btn')?.addEventListener('click', () => {
            sessionStorage.removeItem('currentQuiz');
            this.onNavigate('quizlab');
        });

        // Update progress to 100%
        const fill = document.getElementById('quiz-progress-fill');
        const text = document.getElementById('quiz-progress-text');
        const pctText = document.getElementById('quiz-progress-pct');
        if (fill) fill.style.width = '100%';
        if (text) text.textContent = 'Completed!';
        if (pctText) pctText.textContent = '100%';
    }

    showConfetti() {
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#22d3ee', '#06b6d4', '#0891b2', '#fbbf24', '#f59e0b', '#34d399', '#a78bfa', '#f472b6'];
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.vy += 0.05;
                if (frame > 60) p.opacity -= 0.01;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (frame < 150 && particles.some(p => p.opacity > 0)) {
                requestAnimationFrame(animate);
            } else {
                canvas.remove();
            }
        };
        requestAnimationFrame(animate);
    }

    startTimer() {
        this.timeElapsed = 0;
        this.timer = setInterval(() => {
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

    destroy() {
        this.stopTimer();
    }
}
