export const Card = (content, extraClasses = "") => {
    return `
        <div class="backdrop-blur-2xl bg-white/80 dark:bg-gray-900/50 border border-white/20 dark:border-white/10 rounded-2xl shadow-xl p-6 md:p-8 ${extraClasses}">
            ${content}
        </div>
    `;
};
