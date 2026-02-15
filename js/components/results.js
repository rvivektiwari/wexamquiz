import { createElement, clearElement } from '../utils/dom.js';

export class Results {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(data) {
        clearElement(this.container);

        if (!data) {
            this.renderNotFound();
            return;
        }

        const article = createElement('article', 'word-entry');

        // Header (Word + Phonetic)
        const header = createElement('div', 'word-header');
        const textBox = createElement('div');
        const title = createElement('h1', 'word-title', data.word);
        const phonetic = createElement('p', 'word-phonetic', data.phonetic);

        textBox.appendChild(title);
        textBox.appendChild(phonetic);
        header.appendChild(textBox);
        article.appendChild(header);

        // Meanings
        data.meanings.forEach(meaning => {
            const section = createElement('section', 'meaning-section');

            // Part of Speech
            const posHeader = createElement('h3', 'part-of-speech-header', meaning.partOfSpeech);
            section.appendChild(posHeader);

            // Definitions List
            const ul = createElement('ul', 'meaning-list');
            meaning.definitions.forEach(def => {
                const li = createElement('li');
                li.textContent = def.definition;

                if (def.example) {
                    const example = createElement('span', 'example', `"${def.example}"`);
                    li.appendChild(document.createElement('br'));
                    li.appendChild(example);
                }
                ul.appendChild(li);
            });
            section.appendChild(ul);
            article.appendChild(section);
        });

        this.container.appendChild(article);
    }

    renderNotFound() {
        clearElement(this.container);
        const div = createElement('div', 'not-found');
        const emoji = createElement('span', 'not-found-emoji', '😕');
        const title = createElement('h3', null, 'No Definitions Found');
        const msg = createElement('p', null, "Sorry, we couldn't find definitions for the word you were looking for.");

        div.appendChild(emoji);
        div.appendChild(title);
        div.appendChild(msg);
        this.container.appendChild(div);
    }
}
