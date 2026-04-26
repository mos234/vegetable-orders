/**
 * Vegetable Orders Management - Catalog Page Logic
 * Manages fixed-price items (leafy greens, peeled vegetables).
 */

let editingCatalogItem = null; // name of item being edited, null = new

document.addEventListener('DOMContentLoaded', () => {
    renderCatalogTable();
    document.getElementById('catalog-search').addEventListener('input', debounce(renderCatalogTable, 200));
});

function renderCatalogTable() {
    const search = document.getElementById('catalog-search').value.trim().toLowerCase();
    const catalog = getPriceCatalog();
    const tbody = document.getElementById('catalog-tbody');
    const emptyState = document.getElementById('catalog-empty-state');

    let entries = Object.entries(catalog);
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
    document.getElementById('catalog-price').value = price || '';
    document.getElementById('catalog-notes').value = notes;
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

    if (!name) { alert('נא להזין שם פריט'); return; }
    if (isNaN(price) || price <= 0) { alert('נא להזין מחיר תקין'); return; }

    // If adding new item, check it doesn't already exist
    if (!editingCatalogItem) {
        const catalog = getPriceCatalog();
        if (catalog[name]) {
            if (!confirm(`"${name}" כבר קיים בקטלוג. האם לעדכן את המחיר?`)) return;
        }
    }

    saveCatalogItem(name, { price, notes });
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

Object.assign(window, {
    openAddCatalogModal, openEditCatalogModal, closeCatalogModal,
    saveCatalogModal, deleteCatalogItemConfirm
});
