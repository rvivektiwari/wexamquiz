import { DBService } from '../services/db.js';

export class PerformanceScreen {
    constructor(containerId, user, onNavigate) {
        this.container = document.getElementById(containerId);
        this.user = user;
        this.onNavigate = onNavigate;
        this.performanceData = null;
    }

    render() {
        if (!this.user) {
            this.onNavigate('login');
            return;
        }

        this.container.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
                <div class="mesh-gradient-1 fixed top-0 left-0 w-full h-full pointer-events-none z-0"></div>
                <div class="mesh-gradient-2 fixed top-0 right-0 w-full h-full pointer-events-none z-0"></div>

                <header class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                    <div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <button id="perf-back-btn" class="btn-icon w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                                <span class="material-icons-round">arrow_back</span>
                            </button>
                            <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span class="material-icons-round text-brand-600 dark:text-cyan-400">insights</span>
                                Performance
                            </h1>
                        </div>
                    </div>
                </header>

                <main class="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 fade-in" id="perf-main">
                    <!-- Skeleton loader -->
                    <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer"></div>
                            <div class="w-40 h-5 rounded bg-gray-200 dark:bg-gray-700 shimmer"></div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            ${[1, 2, 3, 4].map(() => `
                                <div class="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                                    <div class="w-16 h-8 mx-auto rounded bg-gray-200 dark:bg-gray-700 shimmer mb-2"></div>
                                    <div class="w-20 h-3 mx-auto rounded bg-gray-200 dark:bg-gray-700 shimmer"></div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                </main>
            </div>
        `;

        document.getElementById('perf-back-btn')?.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                this.onNavigate('home');
            }
        });

        this.loadPerformance();
    }

    async loadPerformance() {
        const main = document.getElementById('perf-main');
        if (!main) return;

        try {
            const data = await DBService.getQuizPerformance(this.user.uid);
            this.performanceData = data;

            if (!data.overview) {
                main.innerHTML = `
                    <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm text-center">
                        <span class="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4 block">quiz</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No Quiz Data Yet</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Take your first quiz to unlock performance insights, chapter breakdown, and personalized improvement suggestions.</p>
                        <button id="start-quiz-empty" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 dark:bg-cyan-500 text-white font-semibold rounded-xl hover:bg-brand-700 dark:hover:bg-cyan-400 transition-all min-h-[44px] shadow-lg">
                            <span class="material-icons-round">rocket_launch</span>
                            Take a Quiz
                        </button>
                    </section>
                `;
                document.getElementById('start-quiz-empty')?.addEventListener('click', () => {
                    this.onNavigate('quizlab');
                });
                return;
            }

            const { overview, chapters, improvements, suggestions } = data;
            const trendIcon = overview.trend === 'improving' ? 'trending_up' : overview.trend === 'declining' ? 'trending_down' : 'trending_flat';
            const trendColor = overview.trend === 'improving' ? 'text-emerald-500' : overview.trend === 'declining' ? 'text-red-500' : 'text-yellow-500';
            const trendLabel = overview.trend === 'improving' ? 'Improving' : overview.trend === 'declining' ? 'Declining' : 'Steady';

            const totalMins = Math.floor(overview.totalTime / 60);
            const totalHrs = Math.floor(totalMins / 60);
            const timeStr = totalHrs > 0 ? `${totalHrs}h ${totalMins % 60}m` : `${totalMins}m`;

            const sparkline = this.buildSparkline(overview.last5Scores);

            let html = `
                <!-- Overview -->
                <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm perf-card-animate">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span class="material-icons-round text-brand-600 dark:text-cyan-400">analytics</span>
                            Overview
                        </h3>
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColor} bg-gray-100 dark:bg-gray-800">
                            <span class="material-icons-round text-sm">${trendIcon}</span>
                            ${trendLabel}
                        </span>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-6 mb-6">
                        <div class="perf-circle-wrap">
                            <svg class="perf-circle" viewBox="0 0 120 120" width="120" height="120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="8" class="text-gray-200 dark:text-gray-700"/>
                                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#perfGrad)" stroke-width="8" stroke-linecap="round"
                                    stroke-dasharray="${Math.round(2 * Math.PI * 52)}"
                                    stroke-dashoffset="${Math.round(2 * Math.PI * 52 * (1 - overview.avgScore / 100))}"
                                    transform="rotate(-90 60 60)"
                                    class="perf-circle-fill"/>
                                <defs>
                                    <linearGradient id="perfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#06b6d4"/>
                                        <stop offset="100%" stop-color="#22d3ee"/>
                                    </linearGradient>
                                </defs>
                                <text x="60" y="55" text-anchor="middle" class="text-2xl font-bold fill-gray-900 dark:fill-white" style="font-size:24px;font-weight:700">${overview.avgScore}%</text>
                                <text x="60" y="72" text-anchor="middle" class="fill-gray-400 dark:fill-gray-500" style="font-size:11px">Average</text>
                            </svg>
                        </div>
                        <div class="grid grid-cols-2 gap-3 flex-1 w-full">
                            <div class="perf-stat-card">
                                <span class="perf-stat-value">${overview.totalQuizzes}</span>
                                <span class="perf-stat-label">Quizzes</span>
                            </div>
                            <div class="perf-stat-card">
                                <span class="perf-stat-value">${overview.bestScore}%</span>
                                <span class="perf-stat-label">Best Score</span>
                            </div>
                            <div class="perf-stat-card">
                                <span class="perf-stat-value">${timeStr}</span>
                                <span class="perf-stat-label">Time Spent</span>
                            </div>
                            <div class="perf-stat-card">
                                ${sparkline}
                                <span class="perf-stat-label">Last 5</span>
                            </div>
                        </div>
                    </div>
                </section>
            `;

            // Chapter Breakdown
            if (chapters.length > 0) {
                const sortedChapters = [...chapters].sort((a, b) => b.avgScore - a.avgScore);
                html += `
                <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm perf-card-animate" style="animation-delay:0.1s">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <span class="material-icons-round text-brand-600 dark:text-cyan-400">library_books</span>
                        Chapter Breakdown
                    </h3>
                    <div class="space-y-3">
                        ${sortedChapters.map(ch => {
                    const barColor = ch.avgScore >= 75 ? 'bg-emerald-500' : ch.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                    const badge = ch.avgScore < 60 ? '<span class="perf-badge-weak">Needs Work</span>' : ch.avgScore >= 85 ? '<span class="perf-badge-strong">Strong</span>' : '';
                    return `
                            <div class="perf-chapter-row">
                                <div class="flex items-center justify-between mb-1.5">
                                    <div class="flex-1 min-w-0">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white truncate block">${this.escapeHtml(ch.chapter)}</span>
                                        <span class="text-xs text-gray-400 dark:text-gray-500">${this.escapeHtml(ch.subject)} · ${ch.attempts} attempt${ch.attempts !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div class="flex items-center gap-2 ml-3 shrink-0">
                                        ${badge}
                                        <span class="text-sm font-bold ${ch.avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : ch.avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${ch.avgScore}%</span>
                                    </div>
                                </div>
                                <div class="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div class="h-full rounded-full ${barColor} perf-bar-animate" style="width:${ch.avgScore}%"></div>
                                </div>
                            </div>`;
                }).join('')}
                    </div>
                </section>`;
            }

            // Areas to Improve
            if (improvements.length > 0 || suggestions.length > 0) {
                html += `
                <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm perf-card-animate" style="animation-delay:0.2s">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <span class="material-icons-round text-amber-500">lightbulb</span>
                        Areas to Improve
                    </h3>`;

                if (improvements.length > 0) {
                    html += `<div class="space-y-3 mb-5">
                        ${improvements.map(ch => {
                        const statusIcon = ch.status === 'declining' ? 'trending_down' : 'warning';
                        const statusColor = ch.status === 'declining' ? 'text-red-500' : 'text-amber-500';
                        const statusText = ch.status === 'declining' ? 'Declining — needs attention' : ch.status === 'weak' ? 'Below average' : 'Needs more practice';
                        return `
                            <div class="perf-improve-row">
                                <div class="flex items-start gap-3">
                                    <span class="material-icons-round ${statusColor} text-xl mt-0.5 shrink-0">${statusIcon}</span>
                                    <div class="flex-1 min-w-0">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white block">${this.escapeHtml(ch.chapter)}</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">${statusText} · Avg: ${ch.avgScore}% · Last: ${ch.lastScore}%</span>
                                    </div>
                                    <button class="perf-retake-btn shrink-0" data-subject="${this.escapeHtml(ch.subject)}" data-chapter="${this.escapeHtml(ch.chapter)}">
                                        <span class="material-icons-round text-sm">refresh</span>
                                        Retake
                                    </button>
                                </div>
                            </div>`;
                    }).join('')}
                    </div>`;
                }

                if (suggestions.length > 0) {
                    html += `<div class="space-y-2">
                        ${suggestions.map(s => {
                        const icon = s.type === 'success' ? 'check_circle' : s.type === 'warning' ? 'warning' : 'error';
                        const color = s.type === 'success' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : s.type === 'warning' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                        return `
                            <div class="flex items-start gap-2.5 p-3 rounded-xl border ${color}">
                                <span class="material-icons-round text-lg shrink-0 mt-0.5">${icon}</span>
                                <span class="text-sm text-gray-700 dark:text-gray-300">${this.escapeHtml(s.message)}</span>
                            </div>`;
                    }).join('')}
                    </div>`;
                }
                html += `</section>`;
            }

            main.innerHTML = html;

            // Retake buttons
            main.querySelectorAll('.perf-retake-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const subject = btn.dataset.subject;
                    const chapter = btn.dataset.chapter;
                    window.location.hash = `#quizlab?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;
                });
            });

        } catch (err) {
            main.innerHTML = `
                <section class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm text-center">
                    <span class="material-icons-round text-3xl text-gray-300 dark:text-gray-600 mb-2 block">error_outline</span>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Couldn't load performance data.</p>
                </section>
            `;
        }
    }

    buildSparkline(scores) {
        if (!scores || scores.length === 0) return '<span class="perf-stat-value">—</span>';
        const w = 60, h = 24;
        const max = Math.max(...scores, 100);
        const min = Math.min(...scores, 0);
        const range = max - min || 1;
        const pts = scores.map((s, i) => {
            const x = (i / Math.max(scores.length - 1, 1)) * w;
            const y = h - ((s - min) / range) * h;
            return `${x},${y}`;
        }).join(' ');
        return `<svg width="${w}" height="${h}" class="perf-sparkline"><polyline points="${pts}" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
}
