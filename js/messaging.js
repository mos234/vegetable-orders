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
 * Opens WhatsApp with the message pre-filled in the compose box,
 * then opens the specific group so the user only needs to tap Send.
 * Step 1: whatsapp://send?text= fills the compose box in WhatsApp.
 * Step 2: after a short delay, the group link opens that specific group.
 * @param {string} message - The message to send
 */
function sendToWhatsAppGroup(message) {
    const encoded = encodeURIComponent(message);
    const groupLink = (typeof getSettings === 'function')
        ? (getSettings().whatsappGroupLink || 'https://chat.whatsapp.com/EVklPHHvAGQ6r7lzVHmks6')
        : 'https://chat.whatsapp.com/EVklPHHvAGQ6r7lzVHmks6';

    // Open WhatsApp with the text pre-filled (works on Android PWA via location.href)
    window.location.href = `whatsapp://send?text=${encoded}`;

    // After WhatsApp opens, redirect to the specific group
    setTimeout(() => {
        window.location.href = groupLink;
    }, 1500);
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
