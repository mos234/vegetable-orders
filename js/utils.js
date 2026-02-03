/**
 * Vegetable Orders Management - Shared Utilities
 * Shared helper functions used across multiple pages.
 */

/**
 * Shows a toast notification.
 * @param {string} message - The message to show
 * @param {string} type - 'success', 'error', 'info' (default: 'success')
 */
function showToast(message, type = 'success') {
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

    // Remove after 3-4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Formats a date string to Hebrew format (DD/MM/YYYY).
 * @param {string} dateStr - Date in YYYY-MM-DD format or ISO string
 * @returns {string} Formatted date
 */
function formatDateHebrew(dateStr) {
    if (!dateStr) return '-';

    // If it's an ISO string (contains T or just date with dashes)
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
 * Escapes HTML to prevent XSS.
 * @param {string} text - The text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Builds the order message for WhatsApp/SMS.
 * @param {Object} order - The order object
 * @returns {string} The formatted message
 */
function buildOrderMessage(order) {
    let message = `שלום ${order.supplierName},\n\n`;
    message += `הזמנה ${order.orderNumber}\n`;
    message += `תאריך אספקה: ${formatDateHebrew(order.deliveryDate)}\n\n`;
    message += `פריטים:\n`;

    (order.items || []).forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.quantity} ${item.unit}`;
        if (item.price > 0) {
            message += ` (₪${item.price} ליחידה)`;
        }
        message += `\n`;
    });

    message += `\nסה"כ: ₪${(order.total || 0).toFixed(2)}`;

    if (order.notes) {
        message += `\n\nהערות: ${order.notes}`;
    }

    message += `\n\nתודה רבה!`;

    return message;
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
