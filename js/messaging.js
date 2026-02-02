/**
 * Vegetable Orders Management - Messaging Layer
 * Handles WhatsApp and SMS integration for sending orders to suppliers.
 */

/**
 * Formats a phone number for use in messaging URLs.
 * Removes dashes, spaces, and adds country code if needed.
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with Israel country code (972)
    if (cleaned.startsWith('0')) {
        cleaned = '972' + cleaned.substring(1);
    }

    // If doesn't start with country code, add Israel code
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
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Ensure it starts with 0 for local SMS
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
 * Opens WhatsApp web/app with pre-filled message.
 * @param {Object} order - The order object
 * @param {string} order.phone - Supplier phone number
 * @param {string} order.supplierName - Supplier name
 * @param {string} [order.message] - Custom message (optional)
 * @param {Array} [order.items] - Order items (optional)
 */
function sendOrderToWhatsApp(order) {
    const phone = formatPhoneNumber(order.phone);
    let message = order.message;

    // If no custom message, create default order message
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

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}

/**
 * Sends an order message via SMS.
 * Opens the device's SMS app with pre-filled message.
 * @param {Object} order - The order object
 * @param {string} order.phone - Supplier phone number
 * @param {string} order.supplierName - Supplier name
 * @param {string} [order.message] - Custom message (optional)
 * @param {Array} [order.items] - Order items (optional)
 */
function sendOrderToSMS(order) {
    const phone = formatPhoneForSMS(order.phone);
    let message = order.message;

    // If no custom message, create default order message
    if (!message) {
        message = `שלום ${order.supplierName || ''}, `;
        message += `אני רוצה להזמין: `;

        if (order.items && order.items.length > 0) {
            const itemsList = order.items.map(item =>
                `${item.name} ${item.quantity}${item.unit || ''}`
            ).join(', ');
            message += itemsList;
        } else {
            message += `[פרטי ההזמנה]`;
        }

        message += `. תודה!`;
    }

    const encodedMessage = encodeURIComponent(message);
    const smsUrl = `sms:${phone}?body=${encodedMessage}`;

    window.location.href = smsUrl;
}

/**
 * Opens WhatsApp chat with a supplier (no pre-filled message).
 * @param {string} phone - The supplier's phone number
 */
function openWhatsAppChat(phone) {
    const formattedPhone = formatPhoneNumber(phone);
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Opens SMS app with a supplier (no pre-filled message).
 * @param {string} phone - The supplier's phone number
 */
function openSMSChat(phone) {
    const formattedPhone = formatPhoneForSMS(phone);
    window.location.href = `sms:${formattedPhone}`;
}

/**
 * Sends a custom message via WhatsApp.
 * @param {string} phone - The phone number
 * @param {string} message - The message to send
 */
function sendWhatsAppMessage(phone, message) {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Sends a custom message via SMS.
 * @param {string} phone - The phone number
 * @param {string} message - The message to send
 */
function sendSMSMessage(phone, message) {
    const formattedPhone = formatPhoneForSMS(phone);
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${formattedPhone}?body=${encodedMessage}`;
}
