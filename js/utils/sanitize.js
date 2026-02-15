/**
 * Escapes HTML special characters to prevent XSS when injecting into templates.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string safe for HTML injection.
 */
export function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
