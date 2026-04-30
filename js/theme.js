/**
 * Theme Management — Dark / Light Mode
 * Applies theme before first paint (no flash) and persists preference.
 */

const KEY = 'veg-theme';

function getPreferred() {
    return localStorage.getItem(KEY) ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem(KEY, theme);

    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.className = theme === 'dark'
            ? 'fas fa-sun theme-icon'
            : 'fas fa-moon theme-icon';
    });
    document.querySelectorAll('.theme-label').forEach(el => {
        el.textContent = theme === 'dark' ? 'מצב בהיר' : 'מצב כהה';
    });
}

// Apply immediately when module is evaluated
applyTheme(getPreferred());

export function toggleTheme() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferred());

    document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
        btn.addEventListener('click', toggleTheme);
    });

    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.mobile-nav-item').forEach(function (item) {
        const href = item.getAttribute('href');
        if (href === page) {
            item.classList.add('mobile-nav-active');
        }
    });
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem(KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
    }
});
