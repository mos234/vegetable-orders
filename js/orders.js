/**
 * Vegetable Orders Management - Orders Page Logic
 */

const COMMON_VEGETABLES = [
    'עגבניה','מלפפון','פלפל אדום','פלפל ירוק','פלפל צהוב','בצל','בצל ירוק','שום',
    'גזר','תפוח אדמה','בטטה','חציל','קישוא','כרוב','כרוב סגול','חסה','חסה רומית',
    'תרד','פטרוזיליה','כוסברה','שמיר','נענע','בזיליקום','לימון','לימון ליים',
    'אבוקדו','מנגו','אפרסמון','רימון','תפוח עץ','בננה','תפוז','קלמנטינה',
    'אשכולית','ענבים','תות','פטריות','ברוקולי','כרובית','סלרי','שעועית ירוקה',
    'אפונה','תירס','צנונית','סלק','קולורבי','דלעת','דלורית'
];

const UNIT_OPTIONS = [
    { value: 'kg', label: 'ק"ג' },
    { value: 'unit', label: 'יחידה' },
    { value: 'carton', label: 'קרטון' }
];

// Main order items
let orderItems = [];
let itemIdCounter = 0;

// Additional halls
let halls = [];
let hallIdCounter = 0;

// When adding to an existing order
let addToOrderId = null;
let addToOrderOriginalItemCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initOrderPage();
});

function initOrderPage() {
    setupDateDefaults();
    populateSupplierDropdown();
    setupAddItemButton();
    setupActionButtons();

    const params = new URLSearchParams(window.location.search);
    const addToId = params.get('addTo');
    if (addToId) {
        loadOrderForAddition(addToId);
    } else {
        addNewItemRow();
    }
    updateOrderSummary();
}

function loadOrderForAddition(orderId) {
    const order = getOrderById(orderId);
    if (!order) { addNewItemRow(); return; }

    addToOrderId = orderId;

    // Show banner
    const banner = document.createElement('div');
    banner.className = 'bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 mb-4 text-amber-800 text-sm font-medium flex items-center gap-2';
    banner.innerHTML = `<i class="fas fa-plus-circle"></i> מוסיף פריטים להזמנה ${order.orderNumber || ''} — ${order.supplierName}`;
    const form = document.querySelector('main') || document.body;
    form.prepend(banner);

    // Pre-fill supplier
    const supplierSelect = document.getElementById('supplier-select');
    if (supplierSelect && order.supplierId) {
        supplierSelect.value = order.supplierId;
    }

    // Pre-fill dates
    const orderDateInput = document.getElementById('order-date');
    const deliveryDateInput = document.getElementById('delivery-date');
    if (orderDateInput && order.orderDate) orderDateInput.value = order.orderDate;
    if (deliveryDateInput && order.deliveryDate) deliveryDateInput.value = order.deliveryDate;

    // Load existing items (read-only visual) + one new empty row
    const tbody = document.getElementById('items-table-body');
    const emptyState = document.getElementById('empty-items-state');
    if (emptyState) emptyState.classList.add('hidden');

    (order.items || []).forEach(item => {
        const id = ++itemIdCounter;
        const row = document.createElement('tr');
        row.id = `item-row-${id}`;
        row.className = 'opacity-50';
        row.innerHTML = `
            <td class="p-2 text-sm text-slate-600" colspan="4">
                <i class="fas fa-lock text-xs ml-1"></i>${item.name} — ${item.quantity} ${item.unit}
            </td>`;
        tbody.appendChild(row);
        // Push placeholder so summary counts are correct
        orderItems.push({ id, name: item.name, qty: item.quantity, unit: 'kg', price: item.price || 0, total: item.total || 0 });
    });

    addToOrderOriginalItemCount = orderItems.length;
    addNewItemRow();
}

function setupDateDefaults() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const orderDateInput = document.getElementById('order-date');
    const deliveryDateInput = document.getElementById('delivery-date');
    if (orderDateInput) orderDateInput.value = formatDateForInput(today);
    if (deliveryDateInput) deliveryDateInput.value = formatDateForInput(tomorrow);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

function setupAddItemButton() {
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) addBtn.addEventListener('click', () => addNewItemRow());
}

function setupActionButtons() {
    const saveDraftBtn    = document.getElementById('save-draft-btn');
    const saveWhatsappBtn = document.getElementById('save-whatsapp-btn');
    const saveSmsBtn      = document.getElementById('save-sms-btn');
    const saveGroupBtn    = document.getElementById('save-group-btn');
    const addHallBtn      = document.getElementById('add-hall-btn');

    if (saveDraftBtn)    saveDraftBtn.addEventListener('click', () => saveOrderAction('draft'));
    if (saveWhatsappBtn) saveWhatsappBtn.addEventListener('click', () => saveOrderAction('whatsapp'));
    if (saveSmsBtn)      saveSmsBtn.addEventListener('click', () => saveOrderAction('sms'));
    if (saveGroupBtn)    saveGroupBtn.addEventListener('click', () => saveOrderAction('group'));
    if (addHallBtn)      addHallBtn.addEventListener('click', addHall);
}

// ─── Main items ────────────────────────────────────────────────────────────────

function addNewItemRow(tableBodyId, itemsArray, isHall, hallId) {
    tableBodyId  = tableBodyId  || 'items-table-body';
    itemsArray   = itemsArray   || orderItems;
    isHall       = isHall       || false;
    hallId       = hallId       || null;

    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    if (!isHall) {
        document.getElementById('empty-items-state')?.classList.add('hidden');
    }

    let itemId;
    if (isHall) {
        const hall = halls.find(h => h.id === hallId);
        itemId = ++hall.itemCounter;
    } else {
        itemId = ++itemIdCounter;
    }

    const prefix  = isHall ? `hall-${hallId}-` : '';
    const rowId   = `${prefix}item-row-${itemId}`;
    const nameId  = `${prefix}item-name-${itemId}`;
    const qtyId   = `${prefix}item-qty-${itemId}`;
    const unitId  = `${prefix}item-unit-${itemId}`;
    const priceId = `${prefix}item-price-${itemId}`;
    const totalId = `${prefix}item-total-${itemId}`;
    const acId    = `${prefix}autocomplete-${itemId}`;
    const onRemove = isHall
        ? `removeHallItemRow(${hallId}, ${itemId})`
        : `removeItemRow(${itemId})`;

    const row = document.createElement('tr');
    row.id = rowId;
    row.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
    row.innerHTML = `
        <td class="py-3 pr-2">
            <div class="autocomplete-container">
                <input type="text" id="${nameId}" placeholder="הקלד שם פריט..."
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    autocomplete="off">
                <div id="${acId}" class="autocomplete-list"></div>
            </div>
        </td>
        <td class="py-3 px-2">
            <input type="number" id="${qtyId}" placeholder="0" min="0" step="0.5" inputmode="decimal"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
        </td>
        <td class="py-3 px-2">
            <select id="${unitId}"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center bg-white">
                ${UNIT_OPTIONS.map(u => `<option value="${u.value}">${u.label}</option>`).join('')}
            </select>
        </td>
        <td class="py-3 px-2">
            <div class="relative">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₪</span>
                <input type="number" id="${priceId}" placeholder="0.00" min="0" step="0.01" inputmode="decimal"
                    class="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
            </div>
        </td>
        <td class="py-3 px-2">
            <div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold text-center">
                ₪<span id="${totalId}">0.00</span>
            </div>
        </td>
        <td class="py-3 px-2 text-center">
            <button type="button" onclick="${onRemove}"
                class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all" title="הסר פריט">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tableBody.appendChild(row);

    itemsArray.push({ id: itemId, name: '', qty: 0, unit: 'kg', price: 0, total: 0 });

    if (isHall) {
        setupHallItemRowListeners(hallId, itemId);
    } else {
        setupItemRowListeners(itemId);
    }

    document.getElementById(nameId)?.focus();
    updateOrderSummary();
}

function setupItemRowListeners(itemId) {
    const nameInput  = document.getElementById(`item-name-${itemId}`);
    const qtyInput   = document.getElementById(`item-qty-${itemId}`);
    const unitSelect = document.getElementById(`item-unit-${itemId}`);
    const priceInput = document.getElementById(`item-price-${itemId}`);

    nameInput.addEventListener('input', e => {
        updateItemData(itemId, 'name', e.target.value.trim());
        showAutocompleteList(`autocomplete-${itemId}`, e.target.value.trim(),
            v => selectMainAutocomplete(itemId, v));
    });
    nameInput.addEventListener('focus', e => {
        if (e.target.value.trim()) showAutocompleteList(`autocomplete-${itemId}`, e.target.value.trim(),
            v => selectMainAutocomplete(itemId, v));
    });
    nameInput.addEventListener('blur', () => {
        setTimeout(() => hideAutocomplete(`autocomplete-${itemId}`), 200);
        const price = getCatalogPrice(nameInput.value.trim());
        if (price !== null) {
            const priceInput = document.getElementById(`item-price-${itemId}`);
            if (priceInput) { priceInput.value = price; updateItemData(itemId, 'price', price); calculateItemTotal(itemId); }
        }
    });
    nameInput.addEventListener('keydown', e =>
        handleAutocompleteKeydown(e, `autocomplete-${itemId}`, v => selectMainAutocomplete(itemId, v)));

    qtyInput.addEventListener('input', e => {
        updateItemData(itemId, 'qty', parseFloat(e.target.value) || 0);
        calculateItemTotal(itemId);
    });
    unitSelect.addEventListener('change', e => updateItemData(itemId, 'unit', e.target.value));
    priceInput.addEventListener('input', e => {
        updateItemData(itemId, 'price', parseFloat(e.target.value) || 0);
        calculateItemTotal(itemId);
    });
}

function showAutocompleteList(acId, query, onSelect) {
    const list = document.getElementById(acId);
    if (!list || !query) { hideAutocomplete(acId); return; }

    const catalog = getPriceCatalog();
    const catalogNames = Object.keys(catalog);
    // Catalog items first, then common vegetables (no duplicates)
    const allItems = [...new Set([...catalogNames, ...COMMON_VEGETABLES])];
    const filtered = allItems.filter(v => v.includes(query) || query.includes(v)).slice(0, 10);
    if (filtered.length === 0) { hideAutocomplete(acId); return; }

    list.innerHTML = filtered.map((item, i) => {
        const price = getCatalogPrice(item);
        const priceTag = price !== null ? `<span class="text-emerald-600 text-xs mr-2">₪${price}</span>` : '';
        return `<div class="autocomplete-item ${i === 0 ? 'selected' : ''}" data-value="${escapeAttr(item)}" data-index="${i}">
            ${escapeHtml(item)}${priceTag}
        </div>`;
    }).join('');
    list.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('mousedown', () => onSelect(el.dataset.value));
    });
    list.classList.add('active');
}

function hideAutocomplete(acId) {
    document.getElementById(acId)?.classList.remove('active');
}

function handleAutocompleteKeydown(e, acId, onSelect) {
    const list = document.getElementById(acId);
    if (!list?.classList.contains('active')) return;
    const items = list.querySelectorAll('.autocomplete-item');
    const selected = list.querySelector('.autocomplete-item.selected');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min((selected ? parseInt(selected.dataset.index) : -1) + 1, items.length - 1);
        items.forEach((item, i) => item.classList.toggle('selected', i === next));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max((selected ? parseInt(selected.dataset.index) : items.length) - 1, 0);
        items.forEach((item, i) => item.classList.toggle('selected', i === prev));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selected) onSelect(selected.dataset.value);
    } else if (e.key === 'Escape') {
        hideAutocomplete(acId);
    }
}

function getCatalogPrice(name) {
    const entry = getPriceCatalog()[name];
    if (!entry) return null;
    const price = typeof entry === 'object' ? entry.price : entry;
    return price > 0 ? price : null;
}

function selectMainAutocomplete(itemId, value) {
    const nameInput = document.getElementById(`item-name-${itemId}`);
    if (nameInput) nameInput.value = value;
    updateItemData(itemId, 'name', value);
    hideAutocomplete(`autocomplete-${itemId}`);

    const price = getCatalogPrice(value);
    if (price !== null) {
        const priceInput = document.getElementById(`item-price-${itemId}`);
        if (priceInput) priceInput.value = price;
        updateItemData(itemId, 'price', price);
        calculateItemTotal(itemId);
    }

    document.getElementById(`item-qty-${itemId}`)?.focus();
}

function updateItemData(itemId, field, value) {
    const item = orderItems.find(i => i.id === itemId);
    if (item) item[field] = value;
}

function calculateItemTotal(itemId) {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;
    item.total = item.qty * item.price;
    const el = document.getElementById(`item-total-${itemId}`);
    if (el) el.textContent = item.total.toFixed(2);
    updateOrderSummary();
}

function removeItemRow(itemId) {
    document.getElementById(`item-row-${itemId}`)?.remove();
    orderItems = orderItems.filter(i => i.id !== itemId);
    updateOrderSummary();
    if (orderItems.length === 0) {
        document.getElementById('empty-items-state')?.classList.remove('hidden');
    }
}

// ─── Halls ─────────────────────────────────────────────────────────────────────

function addHall() {
    const hallId = ++hallIdCounter;
    const hallNumber = halls.length + 2;
    const hallLabel = `אולם ${arabicToHebrewNumeral(hallNumber)}`;
    halls.push({ id: hallId, name: hallLabel, items: [], itemCounter: 0 });

    const container = document.getElementById('halls-container');
    const wrapper = document.createElement('div');
    wrapper.id = `hall-${hallId}`;
    wrapper.className = 'glass-card rounded-3xl p-8 shadow-sm mb-6';
    wrapper.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <i class="fas fa-building text-teal-600 text-xl flex-shrink-0"></i>
                <input type="text" id="hall-name-${hallId}" value="${hallLabel}"
                    class="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-lg"
                    oninput="updateHallName(${hallId}, this.value)">
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button type="button" onclick="duplicateToHall(${hallId})"
                    class="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 text-sm">
                    <i class="fas fa-copy"></i>
                    שכפל מהזמנה הראשית
                </button>
                <button type="button" onclick="removeHall(${hallId})"
                    class="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-xl transition-all active:scale-95" title="הסר אולם">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        <div class="order-table-container">
            <table class="order-table w-full text-right">
                <thead>
                    <tr class="text-slate-400 text-sm border-b border-slate-200">
                        <th class="pb-4 font-medium pr-2" style="width:30%">שם הפריט</th>
                        <th class="pb-4 font-medium text-center" style="width:12%">כמות</th>
                        <th class="pb-4 font-medium text-center" style="width:15%">יחידה</th>
                        <th class="pb-4 font-medium text-center" style="width:15%">מחיר ליחידה</th>
                        <th class="pb-4 font-medium text-center" style="width:15%">סה"כ</th>
                        <th class="pb-4 font-medium text-center" style="width:8%"></th>
                    </tr>
                </thead>
                <tbody id="hall-items-table-${hallId}"></tbody>
            </table>
        </div>

        <div class="flex justify-between items-center mt-4">
            <button type="button" onclick="addHallItem(${hallId})"
                class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 text-sm">
                <i class="fas fa-plus"></i>
                הוסף פריט
            </button>
            <div class="text-left">
                <p class="text-xs text-slate-500">סה"כ אולם</p>
                <p class="text-xl font-bold text-teal-700">₪<span id="hall-total-${hallId}">0.00</span></p>
            </div>
        </div>
    `;
    container.appendChild(wrapper);

    addHallItem(hallId);
    updateOrderSummary();
}

function removeHall(hallId) {
    document.getElementById(`hall-${hallId}`)?.remove();
    halls = halls.filter(h => h.id !== hallId);
    updateOrderSummary();
}

function updateHallName(hallId, value) {
    const hall = halls.find(h => h.id === hallId);
    if (hall) hall.name = value;
}

function addHallItem(hallId) {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;
    addNewItemRow(`hall-items-table-${hallId}`, hall.items, true, hallId);
}

function removeHallItemRow(hallId, itemId) {
    document.getElementById(`hall-${hallId}-item-row-${itemId}`)?.remove();
    const hall = halls.find(h => h.id === hallId);
    if (hall) hall.items = hall.items.filter(i => i.id !== itemId);
    updateHallTotal(hallId);
    updateOrderSummary();
}

function setupHallItemRowListeners(hallId, itemId) {
    const prefix     = `hall-${hallId}-`;
    const nameInput  = document.getElementById(`${prefix}item-name-${itemId}`);
    const qtyInput   = document.getElementById(`${prefix}item-qty-${itemId}`);
    const unitSelect = document.getElementById(`${prefix}item-unit-${itemId}`);
    const priceInput = document.getElementById(`${prefix}item-price-${itemId}`);
    const acId       = `${prefix}autocomplete-${itemId}`;

    nameInput.addEventListener('input', e => {
        updateHallItemData(hallId, itemId, 'name', e.target.value.trim());
        showAutocompleteList(acId, e.target.value.trim(),
            v => selectHallAutocomplete(hallId, itemId, v));
    });
    nameInput.addEventListener('focus', e => {
        if (e.target.value.trim()) showAutocompleteList(acId, e.target.value.trim(),
            v => selectHallAutocomplete(hallId, itemId, v));
    });
    nameInput.addEventListener('blur', () => {
        setTimeout(() => hideAutocomplete(acId), 200);
        const price = getCatalogPrice(nameInput.value.trim());
        if (price !== null) {
            const priceInput = document.getElementById(`hall-${hallId}-item-price-${itemId}`);
            if (priceInput) { priceInput.value = price; updateHallItemData(hallId, itemId, 'price', price); calculateHallItemTotal(hallId, itemId); }
        }
    });
    nameInput.addEventListener('keydown', e =>
        handleAutocompleteKeydown(e, acId, v => selectHallAutocomplete(hallId, itemId, v)));

    qtyInput.addEventListener('input', e => {
        updateHallItemData(hallId, itemId, 'qty', parseFloat(e.target.value) || 0);
        calculateHallItemTotal(hallId, itemId);
    });
    unitSelect.addEventListener('change', e => updateHallItemData(hallId, itemId, 'unit', e.target.value));
    priceInput.addEventListener('input', e => {
        updateHallItemData(hallId, itemId, 'price', parseFloat(e.target.value) || 0);
        calculateHallItemTotal(hallId, itemId);
    });
}

function selectHallAutocomplete(hallId, itemId, value) {
    const nameInput = document.getElementById(`hall-${hallId}-item-name-${itemId}`);
    if (nameInput) nameInput.value = value;
    updateHallItemData(hallId, itemId, 'name', value);
    hideAutocomplete(`hall-${hallId}-autocomplete-${itemId}`);

    const price = getCatalogPrice(value);
    if (price !== null) {
        const priceInput = document.getElementById(`hall-${hallId}-item-price-${itemId}`);
        if (priceInput) priceInput.value = price;
        updateHallItemData(hallId, itemId, 'price', price);
        calculateHallItemTotal(hallId, itemId);
    }

    document.getElementById(`hall-${hallId}-item-qty-${itemId}`)?.focus();
}

function updateHallItemData(hallId, itemId, field, value) {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;
    const item = hall.items.find(i => i.id === itemId);
    if (item) item[field] = value;
}

function calculateHallItemTotal(hallId, itemId) {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;
    const item = hall.items.find(i => i.id === itemId);
    if (!item) return;
    item.total = item.qty * item.price;
    const el = document.getElementById(`hall-${hallId}-item-total-${itemId}`);
    if (el) el.textContent = item.total.toFixed(2);
    updateHallTotal(hallId);
    updateOrderSummary();
}

function updateHallTotal(hallId) {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;
    const total = hall.items.reduce((sum, i) => sum + i.total, 0);
    const el = document.getElementById(`hall-total-${hallId}`);
    if (el) el.textContent = total.toFixed(2);
}

function duplicateToHall(hallId) {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;

    const validMainItems = orderItems.filter(i => i.name && i.qty > 0);
    if (validMainItems.length === 0) {
        showToast('אין פריטים בהזמנה הראשית לשכפול', 'error');
        return;
    }

    // Clear existing hall items
    const tbody = document.getElementById(`hall-items-table-${hallId}`);
    if (tbody) tbody.innerHTML = '';
    hall.items = [];
    hall.itemCounter = 0;

    // Copy each main item into the hall
    validMainItems.forEach(mainItem => {
        const newItemId = ++hall.itemCounter;
        const itemObj = {
            id: newItemId,
            name: mainItem.name,
            qty: mainItem.qty,
            unit: mainItem.unit,
            price: mainItem.price,
            total: mainItem.total
        };
        hall.items.push(itemObj);

        const prefix  = `hall-${hallId}-`;
        const row = document.createElement('tr');
        row.id = `${prefix}item-row-${newItemId}`;
        row.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
        row.innerHTML = `
            <td class="py-3 pr-2">
                <div class="autocomplete-container">
                    <input type="text" id="${prefix}item-name-${newItemId}" value="${escapeHtml(mainItem.name)}"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        autocomplete="off">
                    <div id="${prefix}autocomplete-${newItemId}" class="autocomplete-list"></div>
                </div>
            </td>
            <td class="py-3 px-2">
                <input type="number" id="${prefix}item-qty-${newItemId}" value="${mainItem.qty}" min="0" step="0.5" inputmode="decimal"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
            </td>
            <td class="py-3 px-2">
                <select id="${prefix}item-unit-${newItemId}"
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center bg-white">
                    ${UNIT_OPTIONS.map(u => `<option value="${u.value}" ${u.value === mainItem.unit ? 'selected' : ''}>${u.label}</option>`).join('')}
                </select>
            </td>
            <td class="py-3 px-2">
                <div class="relative">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₪</span>
                    <input type="number" id="${prefix}item-price-${newItemId}" value="${mainItem.price || ''}" min="0" step="0.01" inputmode="decimal"
                        class="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center">
                </div>
            </td>
            <td class="py-3 px-2">
                <div class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold text-center">
                    ₪<span id="${prefix}item-total-${newItemId}">${mainItem.total.toFixed(2)}</span>
                </div>
            </td>
            <td class="py-3 px-2 text-center">
                <button type="button" onclick="removeHallItemRow(${hallId}, ${newItemId})"
                    class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all" title="הסר פריט">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        setupHallItemRowListeners(hallId, newItemId);
    });

    updateHallTotal(hallId);
    updateOrderSummary();
    showToast('הפריטים שוכפלו בהצלחה ✓');
}

// ─── Summary ───────────────────────────────────────────────────────────────────

function updateOrderSummary() {
    const mainTotal   = orderItems.reduce((sum, i) => sum + i.total, 0);
    const hallsTotal  = halls.reduce((sum, h) => sum + h.items.reduce((s, i) => s + i.total, 0), 0);
    const validMain   = orderItems.filter(i => i.name && i.qty > 0).length;
    const validHalls  = halls.reduce((sum, h) => sum + h.items.filter(i => i.name && i.qty > 0).length, 0);

    document.getElementById('order-total').textContent  = (mainTotal + hallsTotal).toFixed(2);
    document.getElementById('items-count').textContent  = validMain + validHalls;
}

// ─── Save & Send ───────────────────────────────────────────────────────────────

function saveOrderAction(action) {
    // ── "Add to existing order" mode ──
    if (addToOrderId) {
        const newItems = orderItems.slice(addToOrderOriginalItemCount).filter(i => i.name && i.qty > 0);
        if (newItems.length === 0) { alert('נא להוסיף לפחות פריט חדש'); return; }

        const existing = getOrderById(addToOrderId);
        const mappedNew = newItems.map(i => ({
            name: i.name, quantity: i.qty,
            unit: UNIT_OPTIONS.find(u => u.value === i.unit)?.label || i.unit,
            unitValue: i.unit, price: i.price, total: i.total
        }));
        const allItems = [...(existing.items || []), ...mappedNew];
        const newTotal = allItems.reduce((s, i) => s + (i.total || 0), 0);
        updateOrder(addToOrderId, { items: allItems, total: newTotal });

        const additionMsg = `תוספת להזמנה ${existing.orderNumber || ''}:\n` +
            mappedNew.map(i => `• ${i.name}: ${i.quantity} ${i.unit}`).join('\n');

        if (action === 'whatsapp') {
            sendWhatsAppMessage(existing.supplierPhone, additionMsg);
        } else if (action === 'sms') {
            sendSMSMessage(existing.supplierPhone, additionMsg);
        } else if (action === 'group') {
            showGroupPicker(additionMsg);
        }
        showToast('הפריטים נוספו להזמנה ✓');
        setTimeout(() => { window.location.href = 'orders-list.html'; }, 800);
        return;
    }

    const supplierSelect = document.getElementById('supplier-select');
    const supplierId = supplierSelect.value;
    if (!supplierId) {
        alert('נא לבחור ספק');
        supplierSelect.focus();
        return;
    }

    const validItems    = orderItems.filter(i => i.name && i.qty > 0);
    const hasHallItems  = halls.some(h => h.items.some(i => i.name && i.qty > 0));
    if (validItems.length === 0 && !hasHallItems) {
        alert('נא להוסיף לפחות פריט אחד להזמנה');
        return;
    }

    const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
    const supplierName   = selectedOption.dataset.name;
    const supplierPhone  = selectedOption.dataset.phone;

    const order = {
        supplierId,
        supplierName,
        supplierPhone,
        orderDate:    document.getElementById('order-date').value,
        deliveryDate: document.getElementById('delivery-date').value,
        deliveryTime: document.getElementById('delivery-time')?.value || '',
        mainHallName: document.getElementById('main-hall-name')?.value.trim() || '',
        items: validItems.map(i => ({
            name: i.name,
            quantity: i.qty,
            unit: UNIT_OPTIONS.find(u => u.value === i.unit)?.label || i.unit,
            unitValue: i.unit,
            price: i.price,
            total: i.total
        })),
        halls: halls
            .filter(h => h.items.some(i => i.name && i.qty > 0))
            .map(h => ({
                name: h.name,
                items: h.items.filter(i => i.name && i.qty > 0).map(i => ({
                    name: i.name,
                    quantity: i.qty,
                    unit: UNIT_OPTIONS.find(u => u.value === i.unit)?.label || i.unit,
                    unitValue: i.unit,
                    price: i.price,
                    total: i.total
                }))
            })),
        notes: document.getElementById('order-notes').value.trim(),
        total: orderItems.reduce((s, i) => s + i.total, 0) +
               halls.reduce((s, h) => s + h.items.reduce((ss, i) => ss + i.total, 0), 0),
        status: action === 'draft' ? 'draft' : 'sent'
    };

    const savedOrder = saveOrder(order);
    const isOffline = !navigator.onLine;

    // When offline and the intent was to send — queue for Background Sync
    if (isOffline && (action === 'whatsapp' || action === 'sms' || action === 'group')) {
        queueOfflineOrder({ ...savedOrder, _pendingAction: action });
        showToast('אין חיבור — ההזמנה נשמרה ותישלח כשהרשת תחזור', 'warning');
    } else if (action === 'whatsapp') {
        sendWhatsAppMessage(supplierPhone, buildOrderMessage(savedOrder));
        showToast('ההזמנה נשמרה ונשלחה ב-WhatsApp');
    } else if (action === 'sms') {
        sendSMSMessage(supplierPhone, buildOrderMessage(savedOrder));
        showToast('ההזמנה נשמרה ונשלחה ב-SMS');
    } else if (action === 'group') {
        showGroupPicker(buildOrderMessage(savedOrder));
    } else {
        showToast('ההזמנה נשמרה כטיוטה');
    }

    setTimeout(() => {
        if (confirm('האם לעבור לרשימת ההזמנות?')) {
            window.location.href = 'orders-list.html';
        } else {
            resetOrderForm();
        }
    }, 500);
}

function resetOrderForm() {
    document.getElementById('supplier-select').value = '';
    document.getElementById('order-notes').value = '';
    if (document.getElementById('delivery-time')) document.getElementById('delivery-time').value = '';
    if (document.getElementById('main-hall-name')) document.getElementById('main-hall-name').value = '';
    setupDateDefaults();

    orderItems = [];
    itemIdCounter = 0;
    document.getElementById('items-table-body').innerHTML = '';
    document.getElementById('empty-items-state')?.classList.remove('hidden');

    halls = [];
    hallIdCounter = 0;
    document.getElementById('halls-container').innerHTML = '';

    addNewItemRow();
    updateOrderSummary();
}

// ─── Offline / Background Sync ────────────────────────────────────────────────

function openPendingOrdersDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('vegetable-orders-db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('pending-orders')) {
                db.createObjectStore('pending-orders', { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function queueOfflineOrder(order) {
    try {
        const db = await openPendingOrdersDB();
        const tx = db.transaction('pending-orders', 'readwrite');
        tx.objectStore('pending-orders').put(order);

        // Register Background Sync so SW processes it when network returns
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const reg = await navigator.serviceWorker.ready;
            await reg.sync.register('sync-orders');
        }
    } catch (err) {
        console.error('[Orders] Failed to queue offline order:', err);
    }
}

// Expose globals needed by inline onclick handlers in dynamically created HTML
Object.assign(window, {
    removeItemRow, removeHallItemRow, addHallItem,
    removeHall, duplicateToHall, updateHallName
});
