/**
 * Vegetable Orders Management - Returns Page Logic
 * Handles creating and managing returns to suppliers.
 */

const RETURN_UNIT_OPTIONS = [
    { value: 'none', label: 'ללא (רק מספר)' },
    { value: 'kg', label: 'ק"ג' },
    { value: 'unit', label: 'יחידה' },
    { value: 'box', label: 'ארגז' },
    { value: 'bunch', label: 'צרור' },
    { value: 'bag', label: 'שקית' }
];

const RETURN_REASONS = {
    damaged: 'סחורה פגומה',
    wrong_order: 'טעות בהזמנה',
    excess: 'עודפים',
    quality: 'איכות ירודה',
    other: 'אחר'
};

let returnItems = [];
let returnItemCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
    initReturnPage();
});

function initReturnPage() {
    // Set today's date
    const today = new Date();
    const dateInput = document.getElementById('return-date');
    if (dateInput) {
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${y}-${m}-${d}`;
    }

    populateSupplierDropdown();

    // Check if coming from an order (query param)
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    if (orderId) {
        prefillFromOrder(orderId);
    }
}

function populateSupplierDropdown() {
    const select = document.getElementById('return-supplier-select');
    const noMsg = document.getElementById('no-suppliers-msg');
    const suppliers = getSuppliers();

    if (suppliers.length === 0) {
        noMsg.classList.remove('hidden');
        return;
    }
    noMsg.classList.add('hidden');

    suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        opt.dataset.phone = s.phone;
        opt.dataset.name = s.name;
        select.appendChild(opt);
    });
}

function onReturnSupplierChange() {
    const supplierId = document.getElementById('return-supplier-select').value;
    const orderSelect = document.getElementById('return-order-select');

    // Clear order dropdown
    orderSelect.innerHTML = '<option value="">-- בחר הזמנה --</option>';

    if (!supplierId) return;

    // Populate orders for this supplier
    const orders = getOrdersBySupplierId(supplierId);
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    orders.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `${o.orderNumber} — ${formatDateHebrew(o.orderDate)}`;
        orderSelect.appendChild(opt);
    });
}

function onReturnOrderChange() {
    const orderId = document.getElementById('return-order-select').value;
    if (!orderId) return;
    prefillFromOrder(orderId);
}

function prefillFromOrder(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    // Select supplier
    const supplierSelect = document.getElementById('return-supplier-select');
    supplierSelect.value = order.supplierId;
    onReturnSupplierChange();

    // Select order
    const orderSelect = document.getElementById('return-order-select');
    orderSelect.value = orderId;

    // Clear existing items and add order items
    returnItems = [];
    returnItemCounter = 0;
    document.getElementById('return-items-tbody').innerHTML = '';

    (order.items || []).forEach(item => {
        addReturnItemRow(item.name, item.quantity, item.unitValue || 'kg', item.price || 0);
    });
}

function addReturnItemRow(name = '', qty = 0, unit = 'none', price = 0) {
    const tbody = document.getElementById('return-items-tbody');
    const emptyState = document.getElementById('return-empty-state');
    const tableWrap = document.getElementById('return-items-table-wrap');

    emptyState.classList.add('hidden');
    tableWrap.classList.remove('hidden');

    const id = ++returnItemCounter;
    const row = document.createElement('tr');
    row.id = `return-row-${id}`;
    row.className = 'border-t border-slate-100 hover:bg-slate-50 transition-colors';
    row.innerHTML = `
        <td class="py-2 pr-2">
            <div class="autocomplete-container">
                <input type="text" id="return-name-${id}" value="${escapeHtml(name)}"
                    placeholder="שם פריט..."
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autocomplete="off">
                <div id="return-ac-${id}" class="autocomplete-list"></div>
            </div>
        </td>
        <td class="py-2 px-2">
            <input type="number" id="return-qty-${id}" value="${qty || ''}" placeholder="0" min="0" step="0.5"
                class="w-full px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
        </td>
        <td class="py-2 px-2">
            <select id="return-unit-${id}"
                class="w-full px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                ${RETURN_UNIT_OPTIONS.map(u => `<option value="${u.value}" ${u.value === unit ? 'selected' : ''}>${u.label}</option>`).join('')}
            </select>
        </td>
        <td class="py-2 px-2">
            <div class="relative">
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₪</span>
                <input type="number" id="return-price-${id}" value="${price || ''}" placeholder="0.00" min="0" step="0.01"
                    class="w-full pr-6 pl-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
            </div>
        </td>
        <td class="py-2 px-2">
            <div class="bg-red-50 text-red-700 px-2 py-2 rounded-lg text-sm font-bold text-center">
                ₪<span id="return-item-total-${id}">0.00</span>
            </div>
        </td>
        <td class="py-2 px-2 text-center">
            <button onclick="removeReturnItem(${id})"
                class="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    returnItems.push({ id, name, qty: parseFloat(qty) || 0, unit, price: parseFloat(price) || 0, total: 0 });
    setupReturnItemListeners(id);
    calculateReturnItemTotal(id);
    updateReturnSummary();

    if (!name) document.getElementById(`return-name-${id}`).focus();
}

function setupReturnItemListeners(id) {
    const nameInput = document.getElementById(`return-name-${id}`);
    const qtyInput = document.getElementById(`return-qty-${id}`);
    const unitSelect = document.getElementById(`return-unit-${id}`);
    const priceInput = document.getElementById(`return-price-${id}`);

    nameInput.addEventListener('input', e => {
        updateReturnItemData(id, 'name', e.target.value.trim());
        showReturnAutocomplete(id, e.target.value.trim());
    });
    nameInput.addEventListener('blur', () => setTimeout(() => hideReturnAutocomplete(id), 200));

    qtyInput.addEventListener('input', e => {
        updateReturnItemData(id, 'qty', parseFloat(e.target.value) || 0);
        calculateReturnItemTotal(id);
    });

    unitSelect.addEventListener('change', e => updateReturnItemData(id, 'unit', e.target.value));

    priceInput.addEventListener('input', e => {
        updateReturnItemData(id, 'price', parseFloat(e.target.value) || 0);
        calculateReturnItemTotal(id);
    });
}

function showReturnAutocomplete(id, query) {
    const list = document.getElementById(`return-ac-${id}`);
    if (!query) { list.classList.remove('active'); return; }

    const filtered = (typeof COMMON_VEGETABLES !== 'undefined' ? COMMON_VEGETABLES : []).filter(v =>
        v.includes(query)
    ).slice(0, 8);

    if (filtered.length === 0) { list.classList.remove('active'); return; }

    list.innerHTML = filtered.map((item, i) => `
        <div class="autocomplete-item ${i === 0 ? 'selected' : ''}"
            onclick="selectReturnAutocomplete(${id}, '${item}')">${item}</div>
    `).join('');
    list.classList.add('active');
}

function hideReturnAutocomplete(id) {
    const list = document.getElementById(`return-ac-${id}`);
    if (list) list.classList.remove('active');
}

function selectReturnAutocomplete(id, value) {
    document.getElementById(`return-name-${id}`).value = value;
    updateReturnItemData(id, 'name', value);
    hideReturnAutocomplete(id);
    document.getElementById(`return-qty-${id}`).focus();
}

function updateReturnItemData(id, field, value) {
    const item = returnItems.find(i => i.id === id);
    if (item) item[field] = value;
}

function calculateReturnItemTotal(id) {
    const item = returnItems.find(i => i.id === id);
    if (!item) return;
    item.total = item.qty * item.price;
    const el = document.getElementById(`return-item-total-${id}`);
    if (el) el.textContent = item.total.toFixed(2);
    updateReturnSummary();
}

function removeReturnItem(id) {
    const row = document.getElementById(`return-row-${id}`);
    if (row) row.remove();
    returnItems = returnItems.filter(i => i.id !== id);

    if (returnItems.length === 0) {
        document.getElementById('return-empty-state').classList.remove('hidden');
        document.getElementById('return-items-table-wrap').classList.add('hidden');
    }
    updateReturnSummary();
}

function updateReturnSummary() {
    const valid = returnItems.filter(i => i.name && i.qty > 0);
    const total = returnItems.reduce((s, i) => s + i.total, 0);
    document.getElementById('return-items-count').textContent = valid.length;
    document.getElementById('return-total').textContent = total.toFixed(2);
}

function saveReturnAction(action) {
    const supplierSelect = document.getElementById('return-supplier-select');
    const supplierId = supplierSelect.value;
    if (!supplierId) { alert('נא לבחור ספק'); supplierSelect.focus(); return; }

    const reason = document.getElementById('return-reason').value;
    if (!reason) { alert('נא לבחור סיבת החזרה'); return; }

    const validItems = returnItems.filter(i => i.name && i.qty > 0);
    if (validItems.length === 0) { alert('נא להוסיף לפחות פריט אחד'); return; }

    const selectedOpt = supplierSelect.options[supplierSelect.selectedIndex];
    const supplierName = selectedOpt.dataset.name;
    const supplierPhone = selectedOpt.dataset.phone;

    const orderSelect = document.getElementById('return-order-select');
    const orderId = orderSelect.value;
    const orderNumber = orderId ? (getOrderById(orderId)?.orderNumber || '') : '';

    const returnObj = {
        supplierId,
        supplierName,
        supplierPhone,
        orderId,
        orderNumber,
        returnDate: document.getElementById('return-date').value,
        reason,
        items: validItems.map(i => ({
            name: i.name,
            quantity: i.qty,
            unit: RETURN_UNIT_OPTIONS.find(u => u.value === i.unit)?.label || i.unit,
            unitValue: i.unit,
            price: i.price,
            total: i.total
        })),
        notes: document.getElementById('return-notes').value.trim(),
        total: validItems.reduce((s, i) => s + i.total, 0),
        status: action === 'draft' ? 'pending' : 'pending'
    };

    const saved = saveReturn(returnObj);

    if (action === 'whatsapp') {
        const msg = buildReturnMessage(saved);
        sendWhatsAppMessage(supplierPhone, msg);
        showToast('ההחזרה נשמרה ונשלחה ב-WhatsApp');
    } else if (action === 'sms') {
        const msg = buildReturnMessage(saved);
        sendSMSMessage(supplierPhone, msg);
        showToast('ההחזרה נשמרה ונשלחה ב-SMS');
    } else {
        showToast('ההחזרה נשמרה כטיוטה');
    }

    setTimeout(() => {
        window.location.href = 'returns-list.html';
    }, 800);
}

function buildReturnMessage(ret) {
    const reasonLabel = RETURN_REASONS[ret.reason] || ret.reason;
    let msg = `שלום ${ret.supplierName},\n\n`;
    msg += `החזרת סחורה ${ret.returnNumber}\n`;
    msg += `תאריך: ${formatDateHebrew(ret.returnDate)}\n`;
    msg += `סיבה: ${reasonLabel}\n\n`;
    msg += `פריטים:\n`;
    (ret.items || []).forEach((item, i) => {
        const unitText = (item.unitValue === 'none' || item.unit === 'ללא (רק מספר)') ? '' : ` ${item.unit}`;
        msg += `${i + 1}. ${item.name} — ${item.quantity}${unitText}`;
        if (item.price > 0) msg += ` (₪${item.price})`;
        msg += '\n';
    });
    msg += `\nסה"כ זיכוי: ₪${(ret.total || 0).toFixed(2)}`;
    if (ret.notes) msg += `\n\nהערות: ${ret.notes}`;
    msg += '\n\nתודה רבה!';
    return msg;
}

// Expose to window
Object.assign(window, {
    onReturnSupplierChange, onReturnOrderChange,
    addReturnItemRow, removeReturnItem,
    selectReturnAutocomplete, saveReturnAction
});
