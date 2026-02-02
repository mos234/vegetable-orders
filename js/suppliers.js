/**
 * Vegetable Orders Management - Suppliers Page Logic
 * Handles the suppliers management page functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSuppliersPage();
});

/**
 * Initializes the suppliers page.
 */
function initSuppliersPage() {
    setupSupplierForm();
    setupEditModal();
    renderSuppliersList();
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
        const notes = document.getElementById('supplier-notes').value.trim();

        if (!name || !phone) {
            alert('נא למלא שם וטלפון');
            return;
        }

        const supplier = saveSupplier({ name, phone, notes });
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
            const notes = document.getElementById('edit-notes').value.trim();

            if (!name || !phone) {
                alert('נא למלא שם וטלפון');
                return;
            }

            const updated = updateSupplier(id, { name, phone, notes });
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
    const suppliers = getSuppliers();
    const listContainer = document.getElementById('suppliers-list');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.getElementById('suppliers-table-container');
    const countElement = document.getElementById('suppliers-count');

    // Update count
    if (countElement) {
        countElement.textContent = `${suppliers.length} ספקים`;
    }

    // Show/hide empty state
    if (suppliers.length === 0) {
        emptyState.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    // Render suppliers
    listContainer.innerHTML = suppliers.map(supplier => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-4">
                <div class="font-semibold text-slate-900">${escapeHtml(supplier.name)}</div>
            </td>
            <td class="py-4">
                <span class="text-slate-600 font-mono">${escapeHtml(supplier.phone)}</span>
            </td>
            <td class="py-4">
                <span class="text-slate-500 text-sm">${escapeHtml(supplier.notes) || '-'}</span>
            </td>
            <td class="py-4">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    <!-- WhatsApp Button -->
                    <button
                        onclick="handleWhatsApp('${supplier.id}')"
                        class="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center shadow-md"
                        title="שלח הודעת WhatsApp"
                    >
                        <i class="fab fa-whatsapp text-xl"></i>
                    </button>
                    <!-- SMS Button -->
                    <button
                        onclick="handleSMS('${supplier.id}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center shadow-md"
                        title="שלח SMS"
                    >
                        <i class="fas fa-comment-sms text-xl"></i>
                    </button>
                    <!-- Edit Button -->
                    <button
                        onclick="openEditModal('${supplier.id}')"
                        class="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center shadow-md"
                        title="ערוך ספק"
                    >
                        <i class="fas fa-edit text-lg"></i>
                    </button>
                    <!-- Delete Button -->
                    <button
                        onclick="handleDelete('${supplier.id}')"
                        class="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center shadow-md"
                        title="מחק ספק"
                    >
                        <i class="fas fa-trash text-lg"></i>
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

/**
 * Escapes HTML to prevent XSS.
 * @param {string} text - The text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Shows a toast notification.
 * @param {string} message - The message to show
 */
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
    toast.textContent = message;

    // Add animation styles
    toast.style.animation = 'fadeInUp 0.3s ease-out';

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
`;
document.head.appendChild(style);
