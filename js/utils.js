/**
 * Vegetable Orders Management - Shared Utilities
 * Shared helper functions used across multiple pages.
 */

/**
 * Shows a toast notification.
 * @param {string} message - The message to show
 * @param {string} type - 'success', 'error', 'info' (default: 'success')
 */
function showToast(message, type = 'success', duration = 4000) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3';

    // Icon based on type
    let icon = '<i class="fas fa-check-circle text-emerald-400"></i>';
    if (type === 'error') icon = '<i class="fas fa-exclamation-circle text-red-400"></i>';
    if (type === 'info') icon = '<i class="fas fa-info-circle text-blue-400"></i>';

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    // Add animation
    toast.style.animation = 'fadeInUp 0.3s ease-out';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Formats a date string to Hebrew format (DD/MM/YYYY).
 * @param {string} dateStr - Date in YYYY-MM-DD format or ISO string
 * @returns {string} Formatted date
 */
function formatDateHebrew(dateStr) {
    if (!dateStr) return '-';

    let year, month, day;
    if (dateStr.includes('T')) {
        const date = new Date(dateStr);
        year = date.getFullYear();
        month = String(date.getMonth() + 1).padStart(2, '0');
        day = String(date.getDate()).padStart(2, '0');
    } else {
        [year, month, day] = dateStr.split('-');
    }

    return `${day}/${month}/${year}`;
}

/**
 * Converts an Arabic numeral (1-30) to Hebrew letter notation (א', ב', ... ט"ו, ...).
 * @param {number} num
 * @returns {string}
 */
function arabicToHebrewNumeral(num) {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    if (num <= 0 || num > 30) return String(num);
    if (num < 10)  return ones[num] + "'";
    if (num === 10) return "י'";
    if (num === 15) return 'ט"ו';
    if (num === 16) return 'ט"ז';
    if (num < 20)  return 'י"' + ones[num - 10];
    if (num === 20) return "כ'";
    if (num === 30) return "ל'";
    const tensLetters = ['', 'י', 'כ'];
    return tensLetters[Math.floor(num / 10)] + '"' + ones[num % 10];
}

/**
 * Formats a date as: "יום ראשון ד' ניסן 22/3" (Hebrew weekday + Hebrew calendar date + Gregorian day/month).
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Full Hebrew date string
 */
function formatDateHebrewFull(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);

    try {
        const weekday = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(date);

        // Get Hebrew day number (returned as Arabic numeral by Intl) and convert to Hebrew letters
        const hebrewDayNum = parseInt(
            new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(date), 10
        );
        const hebrewDay = arabicToHebrewNumeral(hebrewDayNum);

        // Get Hebrew month name, strip leading ב if present
        const hebrewMonth = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(date)
            .replace(/^ב/, '');

        return `${weekday} ${hebrewDay} ${hebrewMonth} ${day}/${month}`;
    } catch (e) {
        return `${day}/${month}/${year}`;
    }
}

/**
 * Escapes HTML to prevent XSS (for text content).
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escapes a string for safe use inside an HTML attribute value (delimited by double quotes).
 * Handles Hebrew text with geresh/gershayim (׳ ״ ' ").
 * @param {string} text
 * @returns {string}
 */
function escapeAttr(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Builds the order message for WhatsApp/SMS.
 * @param {Object} order - The order object
 * @returns {string} The formatted message
 */
function buildOrderMessage(order) {
    const dateStr = formatDateHebrewFull(order.deliveryDate);
    let message = dateStr ? `${dateStr}\n` : '';

    if (order.deliveryTime) {
        message += `לשעה ${order.deliveryTime}\n`;
    }

    if (order.notes) {
        message += `${order.notes}\n`;
    }

    const formatItem = item => {
        const qty = item.quantity > 0 ? `${item.quantity} ` : '';
        return `${qty}${item.name}\n`;
    };

    if (order.items && order.items.length > 0) {
        message += `${order.mainHallName || "אולם א'"}\n`;
        order.items.forEach(item => { message += formatItem(item); });
    }

    if (order.halls && order.halls.length > 0) {
        order.halls.forEach(hall => {
            if (!hall.items || hall.items.length === 0) return;
            message += `\n${hall.name || 'אולם'}\n`;
            hall.items.forEach(item => { message += formatItem(item); });
        });
    }

    return message.trimEnd();
}

/**
 * Debounce function for search inputs.
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Returns HTML for a status badge.
 * @param {string} status - 'draft', 'sent', 'delivered', 'cancelled'
 * @returns {string} HTML string
 */
function getStatusBadgeHtml(status) {
    const badges = {
        draft: '<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">טיוטה</span>',
        sent: '<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">נשלח</span>',
        delivered: '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">סופק</span>',
        cancelled: '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">בוטל</span>'
    };
    return badges[status] || badges.draft;
}

// Add shared animation styles to head
(function addStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('shared-utils-styles')) return;

    const style = document.createElement('style');
    style.id = 'shared-utils-styles';
    style.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeOutDown {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, 20px); }
        }
    `;
    document.head.appendChild(style);
})();

// ===== MOBILE "MORE" MENU =====
// Injects a hamburger button into the mobile header and a bottom-sheet
// with links to pages not shown in the bottom nav.
// Runs on DOMContentLoaded so it works on every page that loads utils.js.

(function () {
    function initMobileMenu() {
        var header = document.querySelector('.mobile-header-bar');
        if (!header) return; // desktop or no header

        // Avoid adding multiple buttons
        if (document.getElementById('mobile-more-btn')) return;

        // Create hamburger button
        var btn = document.createElement('button');
        btn.id = 'mobile-more-btn';
        btn.setAttribute('aria-label', 'תפריט נוסף');
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/30';
        btn.innerHTML = '<i class="fas fa-bars text-lg"></i>';
        btn.style.marginRight = '8px';
        btn.addEventListener('click', toggleMobileMenu);

        // Insert before the theme toggle (first button in header)
        var themeBtn = header.querySelector('button');
        if (themeBtn) {
            themeBtn.parentNode.insertBefore(btn, themeBtn);
        } else {
            header.appendChild(btn);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    function toggleMobileMenu() {
        var existing = document.getElementById('mobile-more-overlay');
        if (existing) { existing.remove(); return; }

        var overlay = document.createElement('div');
        overlay.id = 'mobile-more-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;';

        overlay.innerHTML =
            '<div style="background:#fff;width:100%;max-width:480px;border-radius:24px 24px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 40px rgba(0,0,0,0.15);">' +
                '<div style="width:36px;height:4px;background:#cbd5e1;border-radius:4px;margin:0 auto 20px;"></div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">' +
                    moreMenuItem('catalog.html', 'fa-tag', 'קטלוג', '#10b981') +
                    moreMenuItem('suppliers.html', 'fa-truck', 'ספקים', '#3b82f6') +
                    moreMenuItem('groups.html', 'fa-users', 'קבוצות WA', '#14b8a6') +
                    moreMenuItem('settings.html', 'fa-cog', 'הגדרות', '#6366f1') +
                    moreMenuItem('monthly-report.html', 'fa-chart-line', 'דו"ח חודשי', '#f59e0b') +
                '</div>' +
            '</div>';

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    function moreMenuItem(href, icon, label, color) {
        return '<a href="' + href + '" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border-radius:16px;background:#f8fafc;text-decoration:none;border:1px solid #e2e8f0;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:' + color + '15;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas ' + icon + '" style="color:' + color + ';font-size:18px;"></i>' +
            '</div>' +
            '<span style="font-size:13px;font-weight:600;color:#334155;">' + label + '</span>' +
        '</a>';
    }

    // Expose for inline use if needed
    window.toggleMobileMenu = toggleMobileMenu;
})();
