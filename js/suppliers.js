/**
 * Vegetable Orders Management - Suppliers Page Logic
 * Handles the suppliers management page functionality.
 */

import { getSuppliers, saveSupplier, updateSupplier, deleteSupplier, getSupplierById } from './storage.js';
import { showToast, escapeHtml } from './utils.js';
import { openWhatsAppChat, openSMSChat } from './messaging.js';
import './theme.js';
import './sync.js';

document.addEventListener('DOMContentLoaded', () => {
    initSuppliersPage();
});

const HEBREW_ALPHABET = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];

let selectedLetter = '';

/**
 * Initializes the suppliers page.
 */
function initSuppliersPage() {
    setupSupplierForm();
    setupEditModal();
    setupSearch();
    setupAlphabetBar();
    renderSuppliersList();
}

function setupSearch() {
    const searchInput = document.getElementById('suppliers-search');
    if (!searchInput) return;
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim()) {
            selectedLetter = '';
            renderAlphabetBar();
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderSuppliersList, 300);
    });
}

function setupAlphabetBar() {
    const bar = document.getElementById('alphabet-bar');
    if (!bar) return;
    renderAlphabetBar();
    bar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-letter]');
        if (!btn) return;
        const letter = btn.dataset.letter;
        selectedLetter = selectedLetter === letter ? '' : letter;
        const searchInput = document.getElementById('suppliers-search');
        if (searchInput) searchInput.value = '';
        renderAlphabetBar();
        renderSuppliersList();
    });
}

function renderAlphabetBar() {
    const bar = document.getElementById('alphabet-bar');
    if (!bar) return;
    bar.innerHTML = HEBREW_ALPHABET.map(letter => `
        <button type="button" data-letter="${letter}"
            class="w-8 h-8 rounded-lg text-sm font-bold transition-all ${selectedLetter === letter
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}">
            ${letter}
        </button>
    `).join('');
}

/**
 * Sets up the add supplier form.
 */
function setupSupplierForm() {
    const form = document.getElementById('supplier-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('supplier-name').value.trim();
        const phone = document.getElementById('supplier-phone').value.trim();
        const phone2 = document.getElementById('supplier-phone2').value.trim();
        const email = document.getElementById('supplier-email').value.trim();
        const notes = document.getElementById('supplier-notes').value.trim();

        if (!name || !phone) {
            alert('נא למלא שם וטלפון');
            return;
        }

        const supplier = saveSupplier({ name, phone, phone2, email, notes });
        console.log('Supplier saved:', supplier);

        // Reset form
        form.reset();

        // Re-render list
        renderSuppliersList();

        // Show success feedback
        showToast('הספק נוסף בהצלחה!');
    });
}

/**
 * Sets up the edit modal functionality.
 */
function setupEditModal() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-edit');
    const editForm = document.getElementById('edit-form');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }

    // Handle edit form submission
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = document.getElementById('edit-id').value;
            const name = document.getElementById('edit-name').value.trim();
            const phone = document.getElementById('edit-phone').value.trim();
            const phone2 = document.getElementById('edit-phone2').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const notes = document.getElementById('edit-notes').value.trim();

            if (!name || !phone) {
                alert('נא למלא שם וטלפון');
                return;
            }

            const updated = updateSupplier(id, { name, phone, phone2, email, notes });
            if (updated) {
                closeEditModal();
                renderSuppliersList();
                showToast('הספק עודכן בהצלחה!');
            }
        });
    }
}

/**
 * Opens the edit modal with supplier data.
 * @param {string} id - The supplier ID
 */
function openEditModal(id) {
    const supplier = getSupplierById(id);
    if (!supplier) return;

    document.getElementById('edit-id').value = supplier.id;
    document.getElementById('edit-name').value = supplier.name;
    document.getElementById('edit-phone').value = supplier.phone;
    document.getElementById('edit-phone2').value = supplier.phone2 || '';
    document.getElementById('edit-email').value = supplier.email || '';
    document.getElementById('edit-notes').value = supplier.notes || '';

    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Closes the edit modal.
 */
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Renders the suppliers list.
 */
function renderSuppliersList() {
    const allSuppliers = getSuppliers().slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
    const q = (document.getElementById('suppliers-search')?.value || '').trim().toLowerCase();

    const emptyState     = document.getElementById('empty-state');
    const noResults      = document.getElementById('no-results-state');
    const tableContainer = document.getElementById('suppliers-table-container');
    const listContainer  = document.getElementById('suppliers-list');
    const countElement   = document.getElementById('suppliers-count');

    // Hide all panels first
    [emptyState, noResults, tableContainer].forEach(el => el?.classList.add('hidden'));

    if (allSuppliers.length === 0) {
        emptyState?.classList.remove('hidden');
        if (countElement) countElement.textContent = '0 ספקים';
        return;
    }

    if (countElement) countElement.textContent = `${allSuppliers.length} ספקים`;

    let suppliers = allSuppliers;
    if (q) {
        suppliers = suppliers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.phone  || '').includes(q) ||
            (s.phone2 || '').includes(q) ||
            (s.notes  || '').toLowerCase().includes(q));
    } else if (selectedLetter) {
        suppliers = suppliers.filter(s => s.name.trim().startsWith(selectedLetter));
    }

    if (suppliers.length === 0) {
        noResults?.classList.remove('hidden');
        return;
    }

    tableContainer?.classList.remove('hidden');

    // Render suppliers as cards (not table rows) to show full details
    listContainer.innerHTML = suppliers.map(supplier => `
        <tr class="border-b border-slate-100 last:border-0">
            <td class="py-4 px-1">
                <div class="font-semibold text-slate-900 text-base mb-0.5">${escapeHtml(supplier.name)}</div>
                ${supplier.phone  ? `<div class="text-sm text-slate-500"><i class="fas fa-phone text-xs ml-1 text-slate-300"></i>${escapeHtml(supplier.phone)}</div>` : ''}
                ${supplier.phone2 ? `<div class="text-sm text-slate-500"><i class="fas fa-phone text-xs ml-1 text-slate-300"></i>${escapeHtml(supplier.phone2)} <span class="text-xs text-slate-400">(נוסף)</span></div>` : ''}
                ${supplier.email  ? `<div class="text-sm text-slate-500"><i class="fas fa-envelope text-xs ml-1 text-slate-300"></i>${escapeHtml(supplier.email)}</div>` : ''}
                ${supplier.notes  ? `<div class="text-xs text-slate-400 mt-1 italic">${escapeHtml(supplier.notes)}</div>` : ''}
            </td>
            <td class="py-4 align-top">
                <div class="flex items-center justify-end gap-2 flex-wrap">
                    <button onclick="handleWhatsApp('${supplier.id}')"
                        class="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                        title="WhatsApp">
                        <i class="fab fa-whatsapp text-lg"></i>
                    </button>
                    ${supplier.phone2 ? `<button onclick="handleWhatsApp2('${supplier.id}')"
                        class="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                        title="WhatsApp (${supplier.phone2})">
                        <i class="fab fa-whatsapp text-lg"></i><span class="text-xs mr-0.5">2</span>
                    </button>` : ''}
                    <button onclick="handleSMS('${supplier.id}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                        title="SMS">
                        <i class="fas fa-comment-sms text-lg"></i>
                    </button>
                    <button onclick="openEditModal('${supplier.id}')"
                        class="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                        title="ערוך">
                        <i class="fas fa-edit text-base"></i>
                    </button>
                    <button onclick="handleDelete('${supplier.id}')"
                        class="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                        title="מחק">
                        <i class="fas fa-trash text-base"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}


/**
 * Handles WhatsApp button click.
 * @param {string} id - The supplier ID
 */
function handleWhatsApp(id) {
    const supplier = getSupplierById(id);
    if (!supplier) return;

    openWhatsAppChat(supplier.phone);
}

/**
 * Handles WhatsApp button click for second phone.
 * @param {string} id - The supplier ID
 */
function handleWhatsApp2(id) {
    const supplier = getSupplierById(id);
    if (!supplier || !supplier.phone2) return;
    openWhatsAppChat(supplier.phone2);
}

/**
 * Handles SMS button click.
 * @param {string} id - The supplier ID
 */
function handleSMS(id) {
    const supplier = getSupplierById(id);
    if (!supplier) return;

    openSMSChat(supplier.phone);
}

/**
 * Handles delete button click.
 * @param {string} id - The supplier ID
 */
function handleDelete(id) {
    const supplier = getSupplierById(id);
    if (!supplier) return;

    const confirmed = confirm(`האם אתה בטוח שברצונך למחוק את הספק "${supplier.name}"?`);
    if (!confirmed) return;

    const deleted = deleteSupplier(id);
    if (deleted) {
        renderSuppliersList();
        showToast('הספק נמחק בהצלחה');
    }
}

Object.assign(window, { handleWhatsApp, handleWhatsApp2, handleSMS, openEditModal, handleDelete });
