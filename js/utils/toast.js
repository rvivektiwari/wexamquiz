export class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} slide-in`;

        // Icon based on type
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';
        if (type === 'warning') icon = 'warning';

        const iconEl = document.createElement('span');
        iconEl.className = 'material-icons-round toast-icon';
        iconEl.textContent = icon;

        const msgEl = document.createElement('span');
        msgEl.className = 'toast-message';
        msgEl.textContent = message; // textContent prevents XSS

        toast.appendChild(iconEl);
        toast.appendChild(msgEl);

        this.container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('slide-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }
}

export const toast = new Toast();
