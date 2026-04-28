/**
 * Vegetable Orders Management - Price Lists & Templates Page
 */

let editingCatalogItemId = null;
let activeCategory = 'all';
let CATALOG_CATEGORIES = [];

function loadCategories() {
    CATALOG_CATEGORIES = getCatalogCategories();
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    renderCategoryTabs();
    renderPriceLists();
    document.getElementById('catalog-search').addEventListener('input', debounce(renderPriceLists, 200));
});

// ─── Category Tabs ────────────────────────────────────────────────────────────

function renderCategoryTabs() {
    const container = document.getElementById('catalog-category-tabs');
    if (!container) return;
    container.innerHTML = CATALOG_CATEGORIES.map(c => `
        <button id="cat-tab-${c.key}"
            class="${c.key === activeCategory ? 'cat-tab-active' : 'cat-tab-inactive'}"
            onclick="setActiveCategory('${c.key}')">
            <i class="fas ${c.icon}"></i> ${c.label}
        </button>
    `).join('');
}

function setActiveCategory(cat) {
    activeCategory = cat;
    CATALOG_CATEGORIES.forEach(({ key }) => {
        const btn = document.getElementById(`cat-tab-${key}`);
        if (!btn) return;
        btn.classList.toggle('cat-tab-active', key === cat);
        btn.classList.toggle('cat-tab-inactive', key !== cat);
    });
    renderPriceLists();
}

// ─── Main Render ──────────────────────────────────────────────────────────────

function renderPriceLists() {
    const search = document.getElementById('catalog-search').value.trim().toLowerCase();
    const container = document.getElementById('catalog-content');
    const emptyState = document.getElementById('catalog-empty-state');

    let items = getPriceCatalog();

    // Filter by category
    if (activeCategory !== 'all') {
        items = items.filter(item => item.category === activeCategory);
    }
    // Filter by search
    if (search) {
        items = items.filter(item => item.name.toLowerCase().includes(search));
    }

    if (items.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    const suppliers = getSuppliers();

    // Group items by supplierId
    const groups = {};
    items.forEach(item => {
        const key = item.supplierId || '__none__';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    // Sort: named suppliers first, then "no supplier"
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === '__none__') return 1;
        if (b === '__none__') return -1;
        const nameA = (suppliers.find(s => s.id === a) || {}).name || '';
        const nameB = (suppliers.find(s => s.id === b) || {}).name || '';
        return nameA.localeCompare(nameB, 'he');
    });

    container.innerHTML = sortedKeys.map(supplierId => {
        const supplier = suppliers.find(s => s.id === supplierId);
        const supplierName = supplier ? supplier.name : 'ללא ספק';
        const groupItems = groups[supplierId];

        const rows = groupItems.map(item => `
            <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="p-3 font-medium">${escapeHtml(item.name)}</td>
                <td class="p-3 text-center font-bold text-emerald-700">₪${(parseFloat(item.price) || 0).toFixed(2)}</td>
                <td class="p-3 text-center text-slate-500">${escapeHtml(unitLabel(item.unit))}</td>
                <td class="p-3 text-center">
                    <input type="number" min="0" step="0.5" inputmode="decimal"
                        class="catalog-qty-input w-20 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center text-sm"
                        data-item-id="${escapeAttr(item.id)}"
                        placeholder="0">
                </td>
                <td class="p-3 text-slate-400 text-sm">${escapeHtml(item.notes || '')}</td>
                <td class="p-3 text-center">
                    <div class="flex justify-center gap-1">
                        <button data-id="${escapeAttr(item.id)}" onclick="openEditCatalogModal(this.dataset.id)"
                            class="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-all" title="עריכה">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-id="${escapeAttr(item.id)}" onclick="deleteCatalogItemConfirm(this.dataset.id)"
                            class="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all" title="מחיקה">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
        <div class="glass-card rounded-3xl shadow-sm overflow-hidden mb-6">
            <div class="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center gap-2">
                    <i class="fas fa-truck text-emerald-600"></i>
                    <span class="font-bold text-slate-800">${escapeHtml(supplierName)}</span>
                    <span class="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">${groupItems.length} פריטים</span>
                </div>
                <button onclick="openAddCatalogModal('${escapeAttr(supplierId === '__none__' ? '' : supplierId)}')"
                    class="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">
                    <i class="fas fa-plus"></i> הוסף פריט
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50/50">
                        <tr class="text-slate-500 text-xs">
                            <th class="p-3 text-right font-semibold">שם הפריט</th>
                            <th class="p-3 text-center font-semibold">מחיר ₪</th>
                            <th class="p-3 text-center font-semibold">יחידה</th>
                            <th class="p-3 text-center font-semibold">כמות להזמנה</th>
                            <th class="p-3 text-right font-semibold">הערות</th>
                            <th class="p-3 text-center font-semibold w-24">פעולות</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="px-5 py-4 border-t border-slate-100 flex justify-end">
                <button onclick="convertSupplierToOrder('${escapeAttr(supplierId === '__none__' ? '' : supplierId)}')"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-100 active:scale-95 text-sm">
                    <i class="fas fa-cart-plus"></i> הפוך להזמנה — ${escapeHtml(supplierName)}
                </button>
            </div>
        </div>`;
    }).join('');
}

function unitLabel(unit) {
    const map = { kg: 'ק"ג', unit: 'יחידה', carton: 'קרטון', liter: 'ליטר' };
    return map[unit] || unit || '';
}

// ─── Convert to Order ─────────────────────────────────────────────────────────

function convertSupplierToOrder(supplierId) {
    const qtyInputs = document.querySelectorAll('.catalog-qty-input');
    const catalog = getPriceCatalog();
    const items = [];

    qtyInputs.forEach(input => {
        const qty = parseFloat(input.value);
        if (!qty || qty <= 0) return;
        const itemId = input.dataset.itemId;
        const catalogItem = catalog.find(c => c.id === itemId);
        if (!catalogItem) return;
        // Only include items belonging to this supplier block
        const itemSupplierId = catalogItem.supplierId || '';
        const targetSupplierId = supplierId || '';
        if (itemSupplierId !== targetSupplierId) return;
        items.push({ name: catalogItem.name, qty, unit: catalogItem.unit || 'kg', price: catalogItem.price });
    });

    if (items.length === 0) {
        alert('נא להזין כמות לפחות לפריט אחד לפני יצירת הזמנה');
        return;
    }

    sessionStorage.setItem('templateOrder', JSON.stringify({ supplierId, items }));
    window.location.href = 'new-order.html?fromTemplate=1';
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function openAddCatalogModal(presetSupplierId) {
    editingCatalogItemId = null;
    document.getElementById('catalog-modal-title').textContent = 'הוספת פריט למחירון';
    document.getElementById('catalog-name').value = '';
    document.getElementById('catalog-name').removeAttribute('readonly');
    document.getElementById('catalog-price').value = '';
    document.getElementById('catalog-unit').value = 'kg';
    document.getElementById('catalog-notes').value = '';
    document.getElementById('catalog-category').value = '';
    populateSupplierDropdown();
    document.getElementById('catalog-supplier').value = presetSupplierId || '';
    document.getElementById('catalog-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('catalog-name').focus(), 100);
}

function openEditCatalogModal(id) {
    const item = getPriceCatalog().find(c => c.id === id);
    if (!item) return;

    editingCatalogItemId = id;
    document.getElementById('catalog-modal-title').textContent = 'עריכת פריט';
    document.getElementById('catalog-name').value = item.name;
    document.getElementById('catalog-name').setAttribute('readonly', true);
    document.getElementById('catalog-price').value = item.price || '';
    document.getElementById('catalog-unit').value = item.unit || 'kg';
    document.getElementById('catalog-notes').value = item.notes || '';
    document.getElementById('catalog-category').value = item.category || '';
    populateSupplierDropdown();
    document.getElementById('catalog-supplier').value = item.supplierId || '';
    document.getElementById('catalog-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('catalog-price').focus(), 100);
}

function closeCatalogModal() {
    document.getElementById('catalog-modal').classList.add('hidden');
}

function populateSupplierDropdown() {
    const select = document.getElementById('catalog-supplier');
    const suppliers = getSuppliers();
    select.innerHTML = `<option value="">ללא ספק</option>` +
        suppliers.map(s => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join('');
}

function saveCatalogModal() {
    const name = document.getElementById('catalog-name').value.trim();
    const price = parseFloat(document.getElementById('catalog-price').value);
    const unit = document.getElementById('catalog-unit').value;
    const notes = document.getElementById('catalog-notes').value.trim();
    const category = document.getElementById('catalog-category').value;
    const supplierId = document.getElementById('catalog-supplier').value;

    if (!name) { alert('נא להזין שם פריט'); return; }
    if (isNaN(price) || price < 0) { alert('נא להזין מחיר תקין'); return; }

    const item = { name, price, unit, notes, category, supplierId };
    if (editingCatalogItemId) item.id = editingCatalogItemId;

    saveCatalogItem(item);
    closeCatalogModal();
    renderPriceLists();
    showToast(editingCatalogItemId ? 'הפריט עודכן' : `"${name}" נוסף למחירון`);
}

function deleteCatalogItemConfirm(id) {
    const item = getPriceCatalog().find(c => c.id === id);
    if (!item) return;
    if (!confirm(`האם למחוק את "${item.name}" מהמחירון?`)) return;
    deleteCatalogItem(id);
    renderPriceLists();
    showToast(`"${item.name}" הוסר מהמחירון`);
}

// ─── Manage Categories Modal ──────────────────────────────────────────────────

let tempCategories = [];

function openManageCategoriesModal() {
    tempCategories = JSON.parse(JSON.stringify(CATALOG_CATEGORIES));
    renderManageCategoriesList();
    document.getElementById('manage-categories-modal').classList.remove('hidden');
}

function closeManageCategoriesModal() {
    document.getElementById('manage-categories-modal').classList.add('hidden');
}

function renderManageCategoriesList() {
    const container = document.getElementById('categories-list-container');
    container.innerHTML = tempCategories.map((c, index) => {
        if (c.key === 'all') {
            return `
            <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div class="flex items-center gap-2 text-slate-700 font-bold">
                    <i class="fas ${c.icon}"></i> ${c.label}
                </div>
                <span class="text-xs text-slate-400">ברירת מחדל</span>
            </div>`;
        }
        return `
        <div class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div class="flex items-center gap-2 text-slate-700">
                <i class="fas ${c.icon}"></i> ${c.label}
            </div>
            <button onclick="removeTempCategory(${index})" class="text-red-500 hover:text-red-700 p-1">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    }).join('');
}

function addNewCategory() {
    const label = document.getElementById('new-category-label').value.trim();
    let icon = document.getElementById('new-category-icon').value.trim();
    if (!label) return alert('יש להזין שם כרטסיה');
    if (!icon) icon = 'fa-tag';
    if (!icon.startsWith('fa-')) icon = 'fa-' + icon;
    tempCategories.push({ key: 'cat_' + Date.now(), label, icon });
    document.getElementById('new-category-label').value = '';
    document.getElementById('new-category-icon').value = 'fa-tag';
    renderManageCategoriesList();
}

function removeTempCategory(index) {
    if (tempCategories[index].key === 'all') return;
    if (confirm('האם אתה בטוח? פריטים ששויכו לכרטסיה זו יישארו ללא קטגוריה')) {
        tempCategories.splice(index, 1);
        renderManageCategoriesList();
    }
}

function saveCategoriesAndClose() {
    saveCatalogCategories(tempCategories);
    loadCategories();
    renderCategoryTabs();
    populateCategoryDropdowns();
    if (!CATALOG_CATEGORIES.find(c => c.key === activeCategory)) {
        setActiveCategory('all');
    }
    closeManageCategoriesModal();
    showToast('הכרטסיות עודכנו בהצלחה');
}

function populateCategoryDropdowns() {
    const select = document.getElementById('catalog-category');
    if (!select) return;
    const options = CATALOG_CATEGORIES.filter(c => c.key !== 'all').map(c =>
        `<option value="${c.key}">${c.label}</option>`
    );
    select.innerHTML = `<option value="">ללא קטגוריה</option>` + options.join('');
}

Object.assign(window, {
    openAddCatalogModal, openEditCatalogModal, closeCatalogModal,
    saveCatalogModal, deleteCatalogItemConfirm,
    setActiveCategory, convertSupplierToOrder,
    openManageCategoriesModal, closeManageCategoriesModal,
    addNewCategory, removeTempCategory, saveCategoriesAndClose
});
