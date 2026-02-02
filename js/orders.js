/**
 * Vegetable Orders Management - Orders Page Logic
 * Handles the new order page functionality with dynamic table and calculations.
 */

// Common vegetables list for autocomplete
const COMMON_VEGETABLES = [
    'עגבניה',
    'מלפפון',
    'פלפל אדום',
    'פלפל ירוק',
    'פלפל צהוב',
    'בצל',
    'בצל ירוק',
    'שום',
    'גזר',
    'תפוח אדמה',
    'בטטה',
    'חציל',
    'קישוא',
    'כרוב',
    'כרוב סגול',
    'חסה',
    'חסה רומית',
    'תרד',
    'פטרוזיליה',
    'כוסברה',
    'שמיר',
    'נענע',
    'בזיליקום',
    'לימון',
    'לימון ליים',
    'אבוקדו',
    'מנגו',
    'אפרסמון',
    'רימון',
    'תפוח עץ',
    'בננה',
    'תפוז',
    'קלמנטינה',
    'אשכולית',
    'ענבים',
    'תות',
    'פטריות',
    'ברוקולי',
    'כרובית',
    'סלרי',
    'שעועית ירוקה',
    'אפונה',
    'תירס',
    'צנונית',
    'סלק',
    'קולורבי',
    'דלעת',
    'דלורית'
];

// Unit options
const UNIT_OPTIONS = [
    { value: 'kg', label: 'ק"ג' },
    { value: 'unit', label: 'יחידה' },
    { value: 'box', label: 'ארגז' },
    { value: 'bunch', label: 'צרור' },
    { value: 'bag', label: 'שקית' }
];

// Current items in order
let orderItems = [];
let itemIdCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
    initOrderPage();
});

/**
 * Initializes the order page.
 */
function initOrderPage() {
    setupDateDefaults();
    populateSupplierDropdown();
    setupAddItemButton();
    setupActionButtons();
    // Add first empty row
    addNewItemRow();
    updateOrderSummary();
}

/**
 * Sets default dates (today and tomorrow).
 */
function setupDateDefaults() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orderDateInput = document.getElementById('order-date');
    const deliveryDateInput = document.getElementById('delivery-date');

    if (orderDateInput) {
        orderDateInput.value = formatDateForInput(today);
    }
    if (deliveryDateInput) {
        deliveryDateInput.value = formatDateForInput(tomorrow);
    }
}

/**
 * Formats a date for input[type="date"].
 * @param {Date} date
 * @returns {string} YYYY-MM-DD format
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Populates the supplier dropdown with saved suppliers.
 */
function populateSupplierDropdown() {
    const select = document.getElementById('supplier-select');
    const noSuppliersMsg = document.getElementById('no-suppliers-msg');
    const suppliers = getSuppliers();

    if (suppliers.length === 0) {
        noSuppliersMsg.classList.remove('hidden');
        return;
    }

    noSuppliersMsg.classList.add('hidden');

    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (${supplier.phone})`;
        option.dataset.phone = supplier.phone;
        option.dataset.name = supplier.name;
        select.appendChild(option);
    });
}

/**
 * Sets up the add item button.
 */
function setupAddItemButton() {
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addNewItemRow();
        });
    }
}

/**
 * Adds a new item row to the table.
 */
function addNewItemRow() {
    const tableBody = document.getElementById('items-table-body');
    const emptyState = document.getElementById('empty-items-state');

    if (emptyState) {
        emptyState.classList.add('hidden');
    }

    const itemId = ++itemIdCounter;
    const row = document.createElement('tr');
    row.id = `item-row-${itemId}`;
    row.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
    row.innerHTML = `
        <td class="py-3 pr-2">
            <div class="autocomplete-container">
                <input
                    type="text"
                    id="item-name-${itemId}"
                    placeholder="הקלד שם פריט..."
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autocomplete="off"
                    data-item-id="${itemId}"
                >
                <div id="autocomplete-${itemId}" class="autocomplete-list"></div>
            </div>
        </td>
        <td class="py-3 px-2">
            <input
                type="number"
                id="item-qty-${itemId}"
                placeholder="0"
                min="0"
                step="0.5"
                inputmode="decimal"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center"
                data-item-id="${itemId}"
            >
        </td>
        <td class="py-3 px-2">
            <select
                id="item-unit-${itemId}"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center bg-white"
                data-item-id="${itemId}"
            >
                ${UNIT_OPTIONS.map(u => `<option value="${u.value}">${u.label}</option>`).join('')}
            </select>
        </td>
        <td class="py-3 px-2">
            <div class="relative">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₪</span>
                <input
                    type="number"
                    id="item-price-${itemId}"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    inputmode="decimal"
                    class="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center"
                    data-item-id="${itemId}"
                >
            </div>
        </td>
        <td class="py-3 px-2">
            <div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold text-center">
                ₪<span id="item-total-${itemId}">0.00</span>
            </div>
        </td>
        <td class="py-3 px-2 text-center">
            <button
                type="button"
                onclick="removeItemRow(${itemId})"
                class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                title="הסר פריט"
            >
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    tableBody.appendChild(row);

    // Setup event listeners for the new row
    setupItemRowListeners(itemId);

    // Focus on the name input
    document.getElementById(`item-name-${itemId}`).focus();

    // Track item
    orderItems.push({ id: itemId, name: '', qty: 0, unit: 'kg', price: 0, total: 0 });
    updateOrderSummary();
}

/**
 * Sets up event listeners for an item row.
 * @param {number} itemId
 */
function setupItemRowListeners(itemId) {
    const nameInput = document.getElementById(`item-name-${itemId}`);
    const qtyInput = document.getElementById(`item-qty-${itemId}`);
    const unitSelect = document.getElementById(`item-unit-${itemId}`);
    const priceInput = document.getElementById(`item-price-${itemId}`);
    const autocompleteList = document.getElementById(`autocomplete-${itemId}`);

    // Name input with autocomplete
    nameInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        updateItemData(itemId, 'name', value);
        showAutocomplete(itemId, value);
    });

    nameInput.addEventListener('focus', (e) => {
        const value = e.target.value.trim();
        if (value) {
            showAutocomplete(itemId, value);
        }
    });

    nameInput.addEventListener('blur', () => {
        // Delay hiding to allow click on autocomplete
        setTimeout(() => hideAutocomplete(itemId), 200);
    });

    nameInput.addEventListener('keydown', (e) => {
        handleAutocompleteKeydown(e, itemId);
    });

    // Quantity input
    qtyInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        updateItemData(itemId, 'qty', value);
        calculateItemTotal(itemId);
    });

    // Unit select
    unitSelect.addEventListener('change', (e) => {
        updateItemData(itemId, 'unit', e.target.value);
    });

    // Price input
    priceInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        updateItemData(itemId, 'price', value);
        calculateItemTotal(itemId);
    });
}

/**
 * Shows autocomplete suggestions.
 * @param {number} itemId
 * @param {string} query
 */
function showAutocomplete(itemId, query) {
    const autocompleteList = document.getElementById(`autocomplete-${itemId}`);
    if (!query) {
        hideAutocomplete(itemId);
        return;
    }

    const filtered = COMMON_VEGETABLES.filter(v =>
        v.includes(query) || query.includes(v)
    ).slice(0, 8);

    if (filtered.length === 0) {
        hideAutocomplete(itemId);
        return;
    }

    autocompleteList.innerHTML = filtered.map((item, index) => `
        <div
            class="autocomplete-item ${index === 0 ? 'selected' : ''}"
            data-value="${item}"
            data-index="${index}"
            onclick="selectAutocomplete(${itemId}, '${item}')"
        >
            ${item}
        </div>
    `).join('');

    autocompleteList.classList.add('active');
}

/**
 * Hides autocomplete suggestions.
 * @param {number} itemId
 */
function hideAutocomplete(itemId) {
    const autocompleteList = document.getElementById(`autocomplete-${itemId}`);
    if (autocompleteList) {
        autocompleteList.classList.remove('active');
    }
}

/**
 * Handles keyboard navigation in autocomplete.
 * @param {KeyboardEvent} e
 * @param {number} itemId
 */
function handleAutocompleteKeydown(e, itemId) {
    const autocompleteList = document.getElementById(`autocomplete-${itemId}`);
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    const selected = autocompleteList.querySelector('.autocomplete-item.selected');

    if (!autocompleteList.classList.contains('active') || items.length === 0) {
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = selected ? parseInt(selected.dataset.index) : -1;
        const nextIndex = Math.min(currentIndex + 1, items.length - 1);
        items.forEach((item, i) => item.classList.toggle('selected', i === nextIndex));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = selected ? parseInt(selected.dataset.index) : items.length;
        const prevIndex = Math.max(currentIndex - 1, 0);
        items.forEach((item, i) => item.classList.toggle('selected', i === prevIndex));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selected) {
            selectAutocomplete(itemId, selected.dataset.value);
        }
    } else if (e.key === 'Escape') {
        hideAutocomplete(itemId);
    }
}

/**
 * Selects an autocomplete suggestion.
 * @param {number} itemId
 * @param {string} value
 */
function selectAutocomplete(itemId, value) {
    const nameInput = document.getElementById(`item-name-${itemId}`);
    nameInput.value = value;
    updateItemData(itemId, 'name', value);
    hideAutocomplete(itemId);

    // Move focus to quantity
    document.getElementById(`item-qty-${itemId}`).focus();
}

/**
 * Updates item data in the orderItems array.
 * @param {number} itemId
 * @param {string} field
 * @param {*} value
 */
function updateItemData(itemId, field, value) {
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
        item[field] = value;
    }
}

/**
 * Calculates the total for a single item.
 * @param {number} itemId
 */
function calculateItemTotal(itemId) {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;

    const total = item.qty * item.price;
    item.total = total;

    const totalElement = document.getElementById(`item-total-${itemId}`);
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }

    updateOrderSummary();
}

/**
 * Removes an item row from the table.
 * @param {number} itemId
 */
function removeItemRow(itemId) {
    const row = document.getElementById(`item-row-${itemId}`);
    if (row) {
        row.remove();
    }

    orderItems = orderItems.filter(i => i.id !== itemId);
    updateOrderSummary();

    // Show empty state if no items
    if (orderItems.length === 0) {
        const emptyState = document.getElementById('empty-items-state');
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
    }
}

/**
 * Updates the order summary (total and item count).
 */
function updateOrderSummary() {
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    const validItems = orderItems.filter(i => i.name && i.qty > 0);

    document.getElementById('order-total').textContent = total.toFixed(2);
    document.getElementById('items-count').textContent = validItems.length;
}

/**
 * Sets up action buttons (save, send).
 */
function setupActionButtons() {
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const saveWhatsappBtn = document.getElementById('save-whatsapp-btn');
    const saveSmsBtn = document.getElementById('save-sms-btn');

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => saveOrderAction('draft'));
    }
    if (saveWhatsappBtn) {
        saveWhatsappBtn.addEventListener('click', () => saveOrderAction('whatsapp'));
    }
    if (saveSmsBtn) {
        saveSmsBtn.addEventListener('click', () => saveOrderAction('sms'));
    }
}

/**
 * Saves the order and optionally sends it.
 * @param {string} action - 'draft', 'whatsapp', or 'sms'
 */
function saveOrderAction(action) {
    // Validate
    const supplierSelect = document.getElementById('supplier-select');
    const supplierId = supplierSelect.value;

    if (!supplierId) {
        alert('נא לבחור ספק');
        supplierSelect.focus();
        return;
    }

    const validItems = orderItems.filter(i => i.name && i.qty > 0);
    if (validItems.length === 0) {
        alert('נא להוסיף לפחות פריט אחד להזמנה');
        return;
    }

    // Get supplier info
    const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
    const supplierName = selectedOption.dataset.name;
    const supplierPhone = selectedOption.dataset.phone;

    // Build order object
    const order = {
        supplierId: supplierId,
        supplierName: supplierName,
        supplierPhone: supplierPhone,
        orderDate: document.getElementById('order-date').value,
        deliveryDate: document.getElementById('delivery-date').value,
        items: validItems.map(i => ({
            name: i.name,
            quantity: i.qty,
            unit: UNIT_OPTIONS.find(u => u.value === i.unit)?.label || i.unit,
            unitValue: i.unit,
            price: i.price,
            total: i.total
        })),
        notes: document.getElementById('order-notes').value.trim(),
        total: validItems.reduce((sum, i) => sum + i.total, 0),
        status: action === 'draft' ? 'draft' : 'sent'
    };

    // Save order
    const savedOrder = saveOrder(order);
    console.log('Order saved:', savedOrder);

    // Handle action
    if (action === 'whatsapp') {
        const message = buildOrderMessage(savedOrder);
        sendWhatsAppMessage(supplierPhone, message);
        showToast('ההזמנה נשמרה ונשלחה ב-WhatsApp');
    } else if (action === 'sms') {
        const message = buildOrderMessage(savedOrder);
        sendSMSMessage(supplierPhone, message);
        showToast('ההזמנה נשמרה ונשלחה ב-SMS');
    } else {
        showToast('ההזמנה נשמרה כטיוטה');
    }

    // Redirect to orders list or reset form
    setTimeout(() => {
        if (confirm('האם לעבור לרשימת ההזמנות?')) {
            window.location.href = 'orders-list.html';
        } else {
            resetOrderForm();
        }
    }, 500);
}

/**
 * Builds the order message for WhatsApp/SMS.
 * @param {Object} order
 * @returns {string} The formatted message
 */
function buildOrderMessage(order) {
    let message = `שלום ${order.supplierName},\n\n`;
    message += `הזמנה ${order.orderNumber}\n`;
    message += `תאריך אספקה: ${formatDateHebrew(order.deliveryDate)}\n\n`;
    message += `פריטים:\n`;

    order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${item.quantity} ${item.unit}`;
        if (item.price > 0) {
            message += ` (₪${item.price} ליחידה)`;
        }
        message += `\n`;
    });

    message += `\nסה"כ: ₪${order.total.toFixed(2)}`;

    if (order.notes) {
        message += `\n\nהערות: ${order.notes}`;
    }

    message += `\n\nתודה רבה!`;

    return message;
}

/**
 * Formats a date string to Hebrew format.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Date in DD/MM/YYYY format
 */
function formatDateHebrew(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Resets the order form.
 */
function resetOrderForm() {
    document.getElementById('supplier-select').value = '';
    document.getElementById('order-notes').value = '';
    setupDateDefaults();

    // Clear items
    orderItems = [];
    itemIdCounter = 0;
    document.getElementById('items-table-body').innerHTML = '';

    // Add first empty row
    addNewItemRow();
    updateOrderSummary();
}

/**
 * Shows a toast notification.
 * @param {string} message - The message to show
 */
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50';
    toast.textContent = message;
    toast.style.animation = 'fadeInUp 0.3s ease-out';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation keyframes if not already present
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
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
}
