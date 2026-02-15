import { createElement } from '../utils/dom.js';

export class SearchBar {
    constructor(containerId, onSearch) {
        this.container = document.getElementById(containerId);
        this.onSearch = onSearch;
        this.render();
    }

    render() {
        const form = createElement('form', 'search-bar');

        const input = createElement('input', 'search-input');
        input.type = 'text';
        input.placeholder = 'Search for any word...';
        input.setAttribute('aria-label', 'Search for any word');

        const errorMsg = createElement('p', 'input-error-msg', "Whoops, can't be empty…");

        form.appendChild(input);
        form.appendChild(errorMsg);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = input.value.trim();

            if (!query) {
                input.classList.add('error');
                errorMsg.classList.add('visible');
                return;
            }

            input.classList.remove('error');
            errorMsg.classList.remove('visible');
            this.onSearch(query);
        });

        // Remove error state on input
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                errorMsg.classList.remove('visible');
            }
        });

        this.container.appendChild(form);
    }
}
