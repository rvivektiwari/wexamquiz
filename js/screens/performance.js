import { DBService } from '../services/db.js';
import { Layout } from '../components/Layout.js';
import { Card } from '../components/Card.js';

export class PerformanceScreen {
    constructor(containerId, user, onNavigate) {
        this.containerId = containerId;
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

        this.renderSkeleton();
        // Load data after rendering skeleton
        setTimeout(() => this.loadPerformance(), 0);
    }

    renderSkeleton() {
        const skeletonContent = `
            <div class="flex items-center justify-between mb-8">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                <div class="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
            <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div class="w-40 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    ${[1, 2, 3, 4].map(() => `
                        <div class="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                            <div class="w-16 h-8 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2"></div>
                            <div class="w-20 h-3 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const layout = new Layout(this.containerId, this.user, { onNavigate: this.onNavigate });
        this.container.innerHTML = layout.render(`${skeletonContent}`);
        layout.postRender();
    }

    async loadPerformance() {
        try {
            const data = await DBService.getQuizPerformance(this.user.uid);
            this.performanceData = data;

            // Check if user is still on this screen (simple check)
            if (!document.getElementById('perf-main-container')) {
                // If we navigate away fast, container might be different. 
                // But we re-render the whole layout content.
            }

            if (!data.overview) {
                const emptyContent = `
                    <div class="flex flex-col items-center justify-center text-center py-10">
                        <span class="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4 block">quiz</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No Quiz Data Yet</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Take your first quiz to unlock performance insights, chapter breakdown, and personalized improvement suggestions.</p>
                        <button id="start-quiz-empty" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 dark:bg-cyan-500 text-white font-semibold rounded-xl hover:bg-brand-700 dark:hover:bg-cyan-400 transition-all min-h-[44px] shadow-lg">
                            <span class="material-icons-round">rocket_launch</span>
                            Take a Quiz
                        </button>
                    </div>
                `;

                const layout = new Layout(this.containerId, this.user, { onNavigate: this.onNavigate });
                this.container.innerHTML = layout.render(`
                    <div class="max-w-2xl mx-auto" id="perf-main-container">
                        <div class="flex items-center gap-4 mb-6">
                            <button id="perf-back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                                <span class="material-icons-round">arrow_back</span>
                            </button>
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">Performance</h1>
                        </div>
                        ${Card(emptyContent)}
                    </div>
                `);

                layout.postRender();
                this.attachListeners();
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

            let contentHtml = `
                <div class="flex items-center gap-4 mb-6">
                    <button id="perf-back-btn" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" aria-label="Go back">
                        <span class="material-icons-round">arrow_back</span>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span class="material-icons-round text-brand-600 dark:text-cyan-400">insights</span>
                        Performance
                    </h1>
                </div>
            `;

            // Overview Card
            const overviewContent = `
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
                    <div class="relative w-32 h-32 flex items-center justify-center shrink-0">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" class="stroke-gray-200 dark:stroke-gray-700" stroke-width="8" />
                             <circle cx="60" cy="60" r="52" fill="none" stroke="url(#perfGrad)" stroke-width="8" stroke-linecap="round"
                                stroke-dasharray="${Math.round(2 * Math.PI * 52)}"
                                stroke-dashoffset="${Math.round(2 * Math.PI * 52 * (1 - overview.avgScore / 100))}"
                                class="transition-all duration-1000 ease-out"/>
                             <defs>
                                <linearGradient id="perfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#06b6d4"/>
                                    <stop offset="100%" stop-color="#22d3ee"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                             <span class="text-2xl font-bold text-gray-900 dark:text-white">${overview.avgScore}%</span>
                             <span class="text-xs text-gray-500">Average</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 flex-1 w-full">
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <span class="block text-lg font-bold text-gray-900 dark:text-white">${overview.totalQuizzes}</span>
                            <span class="text-xs text-gray-500">Quizzes</span>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <span class="block text-lg font-bold text-gray-900 dark:text-white">${overview.bestScore}%</span>
                            <span class="text-xs text-gray-500">Best Score</span>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <span class="block text-lg font-bold text-gray-900 dark:text-white">${timeStr}</span>
                            <span class="text-xs text-gray-500">Time Spent</span>
                        </div>
                        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                             ${sparkline}
                            <span class="text-xs text-gray-500 mt-1">Last 5</span>
                        </div>
                    </div>
                </div>
            `;
            contentHtml += Card(overviewContent, "mb-6 perf-card-animate");

            // Chapter Breakdown
            if (chapters.length > 0) {
                const sortedChapters = [...chapters].sort((a, b) => b.avgScore - a.avgScore);
                const chapterContent = `
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <span class="material-icons-round text-brand-600 dark:text-cyan-400">library_books</span>
                        Chapter Breakdown
                    </h3>
                    <div class="space-y-4">
                        ${sortedChapters.map(ch => {
                    const barColor = ch.avgScore >= 75 ? 'bg-emerald-500' : ch.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                    const badge = ch.avgScore < 60 ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Needs Work</span>' : ch.avgScore >= 85 ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Strong</span>' : '';
                    return `
                                <div>
                                    <div class="flex items-center justify-between mb-1.5">
                                        <div class="flex-1 min-w-0 pr-2">
                                            <span class="text-sm font-semibold text-gray-900 dark:text-white truncate block">${this.escapeHtml(ch.chapter)}</span>
                                            <span class="text-xs text-gray-400 dark:text-gray-500">${this.escapeHtml(ch.subject)} · ${ch.attempts} attempt${ch.attempts !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0">
                                            ${badge}
                                            <span class="text-sm font-bold ${ch.avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : ch.avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${ch.avgScore}%</span>
                                        </div>
                                    </div>
                                    <div class="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <div class="h-full rounded-full ${barColor} transition-all duration-1000" style="width:${ch.avgScore}%"></div>
                                    </div>
                                </div>`;
                }).join('')}
                    </div>
                `;
                contentHtml += Card(chapterContent, "mb-6 perf-card-animate");
            }

            // Areas to Improve
            if (improvements.length > 0 || suggestions.length > 0) {
                let improveContent = `
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <span class="material-icons-round text-amber-500">lightbulb</span>
                        Areas to Improve
                    </h3>`;

                if (improvements.length > 0) {
                    improveContent += `<div class="space-y-3 mb-5">
                        ${improvements.map(ch => {
                        const statusIcon = ch.status === 'declining' ? 'trending_down' : 'warning';
                        const statusColor = ch.status === 'declining' ? 'text-red-500' : 'text-amber-500';
                        const statusText = ch.status === 'declining' ? 'Declining — needs attention' : ch.status === 'weak' ? 'Below average' : 'Needs more practice';
                        return `
                                <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    <span class="material-icons-round ${statusColor} text-xl mt-0.5 shrink-0">${statusIcon}</span>
                                    <div class="flex-1 min-w-0">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white block">${this.escapeHtml(ch.chapter)}</span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">${statusText} · Avg: ${ch.avgScore}%</span>
                                    </div>
                                    <button class="perf-retake-btn shrink-0 text-xs bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm" data-subject="${this.escapeHtml(ch.subject)}" data-chapter="${this.escapeHtml(ch.chapter)}">
                                        <span class="material-icons-round text-sm">refresh</span>
                                        Retake
                                    </button>
                                </div>`;
                    }).join('')}
                    </div>`;
                }

                if (suggestions.length > 0) {
                    improveContent += `<div class="space-y-2">
                        ${suggestions.map(s => {
                        const icon = s.type === 'success' ? 'check_circle' : s.type === 'warning' ? 'warning' : 'error';
                        const colorClass = s.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : s.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
                        return `
                                <div class="flex items-start gap-2.5 p-3 rounded-xl border ${colorClass}">
                                    <span class="material-icons-round text-lg shrink-0 mt-0.5">${icon}</span>
                                    <span class="text-sm font-medium">${this.escapeHtml(s.message)}</span>
                                </div>`;
                    }).join('')}
                    </div>`;
                }

                contentHtml += Card(improveContent, "perf-card-animate");
            }

            const finalHtml = `<div class="max-w-2xl mx-auto flex flex-col gap-6" id="perf-main-container">${contentHtml}</div>`;

            const layout = new Layout(this.containerId, this.user, { onNavigate: this.onNavigate });
            this.container.innerHTML = layout.render(finalHtml);
            layout.postRender();
            this.attachListeners();

        } catch (err) {
            console.error(err);
            const errorContent = `
                <div class="text-center py-8">
                    <span class="material-icons-round text-3xl text-gray-300 dark:text-gray-600 mb-2 block">error_outline</span>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Couldn't load performance data.</p>
                </div>
            `;
            const layout = new Layout(this.containerId, this.user, { onNavigate: this.onNavigate });
            this.container.innerHTML = layout.render(`<div class="max-w-2xl mx-auto">${Card(errorContent)}</div>`);
            layout.postRender();
        }
    }

    attachListeners() {
        document.getElementById('perf-back-btn')?.addEventListener('click', () => {
            if (window.history.length > 1) window.history.back();
            else this.onNavigate('home');
        });

        document.getElementById('start-quiz-empty')?.addEventListener('click', () => this.onNavigate('quizlab'));

        this.container.querySelectorAll('.perf-retake-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subject = btn.dataset.subject;
                const chapter = btn.dataset.chapter;
                window.location.hash = `#quizlab?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;
            });
        });
    }

    buildSparkline(scores) {
        if (!scores || scores.length === 0) return '<span class="font-mono text-gray-400 text-lg">—</span>';
        const w = 60, h = 24;
        const max = Math.max(...scores, 100);
        const min = Math.min(...scores, 0);
        const range = max - min || 1;

        let pts = '';
        scores.forEach((s, i) => {
            const x = (i / Math.max(scores.length - 1, 1)) * w;
            const y = h - ((s - min) / range) * h;
            pts += `${x},${y} `;
        });

        // Last point circle
        const lastY = h - ((scores[scores.length - 1] - min) / range) * h;

        return `<svg width="${w}" height="${h}" class="overflow-visible"><polyline points="${pts.trim()}" fill="none" class="stroke-cyan-500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${w}" cy="${lastY}" r="3" class="fill-cyan-500" /></svg>`;
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
