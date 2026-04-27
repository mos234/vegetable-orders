/**
 * Vegetable Orders Management - Catalog Page Logic
 * Manages fixed-price items (leafy greens, peeled vegetables).
 */

let editingCatalogItem = null; // name of item being edited, null = new
let activeCategory = 'all';   // active category filter

let CATALOG_CATEGORIES = [];

function loadCategories() {
    CATALOG_CATEGORIES = getCatalogCategories();
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    renderCategoryTabs();
    populateCategoryDropdowns();
    renderCatalogTable();
    document.getElementById('catalog-search').addEventListener('input', debounce(renderCatalogTable, 200));
});

function renderCategoryTabs() {
    const container = document.getElementById('catalog-category-tabs');
    if (!container) return;
    
    container.innerHTML = CATALOG_CATEGORIES.map(c => `
        <button id="cat-tab-${c.key}" class="${c.key === activeCategory ? 'cat-tab-active' : 'cat-tab-inactive'}" onclick="setActiveCategory('${c.key}')">
            <i class="fas ${c.icon}"></i> ${c.label}
        </button>
    `).join('');
}

function populateCategoryDropdowns() {
    const select = document.getElementById('catalog-category');
    if (!select) return;
    
    // exclude 'all' from dropdown
    const options = CATALOG_CATEGORIES.filter(c => c.key !== 'all').map(c => 
        `<option value="${c.key}">${c.label}</option>`
    );
    
    select.innerHTML = `<option value="">ללא קטגוריה</option>\n` + options.join('\n');
}

function setActiveCategory(cat) {
    activeCategory = cat;
    // Update tab styles
    CATALOG_CATEGORIES.forEach(({ key }) => {
        const btn = document.getElementById(`cat-tab-${key}`);
        if (!btn) return;
        if (key === cat) {
            btn.classList.add('cat-tab-active');
            btn.classList.remove('cat-tab-inactive');
        } else {
            btn.classList.remove('cat-tab-active');
            btn.classList.add('cat-tab-inactive');
        }
    });
    renderCatalogTable();
}

function renderCatalogTable() {
    const search = document.getElementById('catalog-search').value.trim().toLowerCase();
    const catalog = getPriceCatalog();
    const tbody = document.getElementById('catalog-tbody');
    const emptyState = document.getElementById('catalog-empty-state');

    let entries = Object.entries(catalog);
    // Filter by active category (items without a category appear only under 'all')
    if (activeCategory !== 'all') {
        entries = entries.filter(([, entry]) => {
            const cat = typeof entry === 'object' ? (entry.category || '') : '';
            return cat === activeCategory;
        });
    }
    if (search) entries = entries.filter(([name]) => name.toLowerCase().includes(search));
    entries.sort(([a], [b]) => a.localeCompare(b, 'he'));

    if (entries.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = entries.map(([name, entry]) => {
        const price = typeof entry === 'object' ? entry.price : entry;
        const notes = typeof entry === 'object' ? (entry.notes || '') : '';
        const safeName = escapeAttr(name);
        return `
        <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium">${escapeHtml(name)}</td>
            <td class="p-4 text-center font-bold text-emerald-700">₪${(parseFloat(price) || 0).toFixed(2)}</td>
            <td class="p-4 text-slate-500 text-sm">${escapeHtml(notes)}</td>
            <td class="p-4 text-center">
                <div class="flex justify-center gap-2">
                    <button data-name="${safeName}" onclick="openEditCatalogModal(this.dataset.name)"
                        class="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-all"
                        title="עריכה">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button data-name="${safeName}" onclick="deleteCatalogItemConfirm(this.dataset.name)"
                        class="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                        title="מחיקה">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openAddCatalogModal() {
    editingCatalogItem = null;
    document.getElementById('catalog-modal-title').textContent = 'הוספת פריט לקטלוג';
    document.getElementById('catalog-name').value = '';
    document.getElementById('catalog-price').value = '';
    document.getElementById('catalog-notes').value = '';
    document.getElementById('catalog-category').value = '';
    document.getElementById('catalog-name').removeAttribute('readonly');
    document.getElementById('catalog-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('catalog-name').focus(), 100);
}

function openEditCatalogModal(name) {
    const catalog = getPriceCatalog();
    const entry = catalog[name];
    if (!entry) return;

    editingCatalogItem = name;
    document.getElementById('catalog-modal-title').textContent = 'עריכת פריט';
    document.getElementById('catalog-name').value = name;
    document.getElementById('catalog-name').setAttribute('readonly', true);

    const price = typeof entry === 'object' ? entry.price : entry;
    const notes = typeof entry === 'object' ? (entry.notes || '') : '';
    const category = typeof entry === 'object' ? (entry.category || '') : '';
    document.getElementById('catalog-price').value = price || '';
    document.getElementById('catalog-notes').value = notes;
    document.getElementById('catalog-category').value = category;
    document.getElementById('catalog-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('catalog-price').focus(), 100);
}

function closeCatalogModal() {
    document.getElementById('catalog-modal').classList.add('hidden');
}

function saveCatalogModal() {
    const name = document.getElementById('catalog-name').value.trim();
    const price = parseFloat(document.getElementById('catalog-price').value);
    const notes = document.getElementById('catalog-notes').value.trim();
    const category = document.getElementById('catalog-category').value;

    if (!name) { alert('נא להזין שם פריט'); return; }
    if (isNaN(price) || price <= 0) { alert('נא להזין מחיר תקין'); return; }

    // If adding new item, check it doesn't already exist
    if (!editingCatalogItem) {
        const catalog = getPriceCatalog();
        if (catalog[name]) {
            if (!confirm(`"${name}" כבר קיים בקטלוג. האם לעדכן את המחיר?`)) return;
        }
    }

    saveCatalogItem(name, { price, notes, category });
    closeCatalogModal();
    renderCatalogTable();
    showToast(editingCatalogItem ? 'המחיר עודכן' : `"${name}" נוסף לקטלוג`);
}

function deleteCatalogItemConfirm(name) {
    if (!confirm(`האם למחוק את "${name}" מהקטלוג?`)) return;
    deleteCatalogItem(name);
    renderCatalogTable();
    showToast(`"${name}" הוסר מהקטלוג`);
}

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

    // generate unique key
    const key = 'cat_' + Date.now();
    tempCategories.push({ key, label, icon });
    
    document.getElementById('new-category-label').value = '';
    document.getElementById('new-category-icon').value = 'fa-tag';
    
    renderManageCategoriesList();
}

function removeTempCategory(index) {
    if (tempCategories[index].key === 'all') return; // protect 'all'
    if (confirm('האם אתה בטוח שברצונך למחוק כרטסיה זו? (פריטים ששויכו אליה יישארו ללא קטגוריה)')) {
        tempCategories.splice(index, 1);
        renderManageCategoriesList();
    }
}

function saveCategoriesAndClose() {
    saveCatalogCategories(tempCategories);
    loadCategories();
    renderCategoryTabs();
    populateCategoryDropdowns();
    
    // Ensure active category still exists, otherwise reset to 'all'
    if (!CATALOG_CATEGORIES.find(c => c.key === activeCategory)) {
        setActiveCategory('all');
    }
    
    closeManageCategoriesModal();
    showToast('הכרטסיות עודכנו בהצלחה');
}

Object.assign(window, {
    openAddCatalogModal, openEditCatalogModal, closeCatalogModal,
    saveCatalogModal, deleteCatalogItemConfirm,
    setActiveCategory,
    openManageCategoriesModal, closeManageCategoriesModal, addNewCategory, removeTempCategory, saveCategoriesAndClose
});
