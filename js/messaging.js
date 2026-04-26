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
