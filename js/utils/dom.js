/**
 * Creates an element with optional class and text content.
 * @param {string} tag - HTML tag name.
 * @param {string} [className] - CSS class name.
 * @param {string} [text] - Text content.
 * @returns {HTMLElement}
 */
export function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

/**
 * Clears all children from an element.
 * @param {HTMLElement} element 
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
