/**
 * Vegetable Orders Management - Messaging Layer
 * Handles WhatsApp and SMS integration for sending orders to suppliers.
 */

/**
 * Opens an external URL in PWA standalone mode.
 * Uses location.href for app:// schemes (whatsapp://, sms:) so the OS
 * intercepts and opens the right app without navigating the PWA away.
 * For https:// links falls back to window.open.
 * @param {string} url
 */
function openExternalUrl(url) {
    if (url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
}

/**
 * Formats a phone number for use in messaging URLs.
 * Removes dashes, spaces, and adds country code if needed.
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '972' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('972') && cleaned.length === 9) {
        cleaned = '972' + cleaned;
    }
    return cleaned;
}

/**
 * Formats a phone number for SMS (local format with leading zero).
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number for SMS
 */
function formatPhoneForSMS(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('972')) {
        cleaned = '0' + cleaned.substring(3);
    }
    if (!cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
    }
    return cleaned;
}

/**
 * Sends an order message via WhatsApp.
 * @param {Object} order - The order object
 */
function sendOrderToWhatsApp(order) {
    const phone = formatPhoneNumber(order.phone);
    let message = order.message;

    if (!message) {
        message = `שלום ${order.supplierName || ''},\n\n`;
        message += `אני רוצה להזמין:\n`;
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                message += `- ${item.name}: ${item.quantity} ${item.unit || ''}\n`;
            });
        } else {
            message += `[פרטי ההזמנה]\n`;
        }
        message += `\nתודה רבה!`;
    }

    window.location.href = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

/**
 * Sends an order message via SMS.
 * @param {Object} order - The order object
 */
function sendOrderToSMS(order) {
    const phone = formatPhoneForSMS(order.phone);
    let message = order.message;

    if (!message) {
        message = `שלום ${order.supplierName || ''}, `;
        message += `אני רוצה להזמין: `;
        if (order.items && order.items.length > 0) {
            message += order.items.map(item =>
                `${item.name} ${item.quantity}${item.unit || ''}`
            ).join(', ');
        } else {
            message += `[פרטי ההזמנה]`;
        }
        message += `. תודה!`;
    }

    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
}

/**
 * Opens WhatsApp chat with a supplier (no pre-filled message).
 * @param {string} phone - The supplier's phone number
 */
function openWhatsAppChat(phone) {
    window.location.href = `whatsapp://send?phone=${formatPhoneNumber(phone)}`;
}

/**
 * Opens SMS app with a supplier (no pre-filled message).
 * @param {string} phone - The supplier's phone number
 */
function openSMSChat(phone) {
    window.location.href = `sms:${formatPhoneForSMS(phone)}`;
}

/**
 * Sends a message to a WhatsApp group.
 *
 * PRIMARY: If a group JID is configured in Settings, uses whatsapp://send?phone=<JID>&text=
 * which opens the group with the message already in the compose box — exactly like sending
 * to a contact. This is what was working before.
 *
 * FALLBACK: If only a group invite link is available (no JID), copies the message to
 * clipboard and opens the link so the user can paste manually.
 *
 * @param {string} message - The message to send
 */
function sendToWhatsAppGroup(message) {
    const settings = (typeof getSettings === 'function') ? getSettings() : {};
    const groupLink = settings.whatsappGroupLink || 'https://chat.whatsapp.com/EVklPHHvAGQ6r7lzVHmks6';

    const open = () => { window.location.href = groupLink; };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(open).catch(open);
    } else {
        const ta = document.createElement('textarea');
        ta.value = message;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        document.body.removeChild(ta);
        open();
    }
}

/**
 * Last-resort fallback: tries execCommand copy, then native prompt.
 * @param {string} message
 * @param {Function} onConfirm
 */
function showCopyDialog(message, onConfirm) {
    const ta = document.createElement('textarea');
    ta.value = message;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);

    if (copied) {
        showToast('✅ ההזמנה הועתקה — עבור לקבוצה והדבק', 'success', 5000);
        setTimeout(onConfirm, 600);
        return;
    }

    window.prompt('העתק את ההזמנה (Ctrl+A → Ctrl+C) ואז לחץ אישור:', message);
    onConfirm();
}

/**
 * Sends a custom message via WhatsApp.
 * @param {string} phone - The phone number
 * @param {string} message - The message to send
 */
function sendWhatsAppMessage(phone, message) {
    window.location.href = `whatsapp://send?phone=${formatPhoneNumber(phone)}&text=${encodeURIComponent(message)}`;
}

/**
 * Sends a custom message via SMS.
 * @param {string} phone - The phone number
 * @param {string} message - The message to send
 */
function sendSMSMessage(phone, message) {
    window.location.href = `sms:${formatPhoneForSMS(phone)}?body=${encodeURIComponent(message)}`;
}

/**
 * Shows a modal to pick which WhatsApp group to send the message to.
 * If no groups are configured, redirects to groups management page.
 * @param {string} message - The pre-built order message
 * @param {Function} onComplete - Callback executed after group is selected and opened
 */
function showGroupPicker(message, onComplete) {
    const groups = (typeof getGroups === 'function') ? getGroups() : [];

    // Also check the old single-group setting for backward compat
    let legacyLink = '';
    try {
        const s = JSON.parse(localStorage.getItem('vegetable_settings') || '{}');
        legacyLink = s.whatsappGroupLink || '';
        if (!legacyLink) {
            const old = JSON.parse(localStorage.getItem('veg-settings') || '{}');
            legacyLink = old.whatsappGroupLink || '';
        }
    } catch (_) {}

    if (groups.length === 0 && !legacyLink) {
        showToast('נא להוסיף קבוצה בדף הקבוצות תחילה', 'error', 3000);
        setTimeout(() => { window.location.href = 'groups.html'; }, 1500);
        return;
    }

    // Build list items — groups from storage + legacy single-group if not already in list
    const allGroups = [...groups];
    if (legacyLink && !allGroups.some(g => g.link === legacyLink)) {
        allGroups.unshift({ id: '__legacy__', name: 'הקבוצה הראשית', link: legacyLink });
    }

    // Remove existing picker if open
    document.getElementById('group-picker-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'group-picker-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-end justify-center bg-black/50';
    overlay.innerHTML = `
        <div class="bg-white w-full max-w-lg rounded-t-3xl p-6 shadow-2xl animate-slide-up">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-slate-800">בחר קבוצה לשליחה</h3>
                <button onclick="document.getElementById('group-picker-overlay').remove()"
                    class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
            <div class="space-y-2 max-h-64 overflow-y-auto">
                ${allGroups.map(g => `
                <button onclick="_sendToSpecificGroup('${escapeAttr(g.link)}', '__MSG__')"
                    class="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 transition-all text-right active:scale-95">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <i class="fab fa-whatsapp text-green-600 text-lg"></i>
                    </div>
                    <span class="font-semibold text-slate-700">${escapeHtml(g.name)}</span>
                </button>`).join('')}
            </div>
            <a href="groups.html" class="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium py-2">
                <i class="fas fa-plus-circle"></i> נהל קבוצות
            </a>
        </div>`;

    // Inject the message into button onclick handlers (safe replacement)
    overlay.querySelectorAll('button[onclick*="__MSG__"]').forEach((btn, i) => {
        btn.onclick = () => _sendToSpecificGroup(allGroups[i].link, message, onComplete);
    });

    // Close on backdrop click
    overlay.addEventListener('click', e => { 
        if (e.target === overlay) {
            overlay.remove();
            if (onComplete) onComplete();
        }
    });
    document.body.appendChild(overlay);
}

/**
 * Copies message to clipboard then opens a specific group link.
 * @param {string} link - WhatsApp group invite link
 * @param {string} message
 * @param {Function} onComplete
 */
function _sendToSpecificGroup(link, message, onComplete) {
    document.getElementById('group-picker-overlay')?.remove();

    const doOpen = () => {
        openExternalUrl(link);
        if (onComplete) onComplete();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message)
            .then(() => {
                showToast('✅ ההזמנה הועתקה — הדבק בקבוצה ושלח', 'success', 5000);
                setTimeout(doOpen, 400);
            })
            .catch(() => showCopyDialog(message, doOpen));
    } else {
        showCopyDialog(message, doOpen);
    }
}
