/**
 * Vegetable Orders Management - Returns List Page Logic
 */

const RETURN_STATUS_LABELS = {
    pending: { label: 'ממתינה', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'אושרה', cls: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'נדחתה', cls: 'bg-red-100 text-red-700' }
};

const RETURN_REASON_LABELS = {
    damaged: 'סחורה פגומה',
    wrong_order: 'טעות בהזמנה',
    excess: 'עודפים',
    quality: 'איכות ירודה',
    other: 'אחר'
};

document.addEventListener('DOMContentLoaded', () => {
    initReturnsListPage();
});

function initReturnsListPage() {
    populateSupplierFilter();
    setupReturnFilters();
    renderReturnsList();
    updateReturnStats();
}

function populateSupplierFilter() {
    const select = document.getElementById('filter-return-supplier');
    getSuppliers().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

function setupReturnFilters() {
    document.getElementById('filter-return-status').addEventListener('change', renderReturnsList);
    document.getElementById('filter-return-supplier').addEventListener('change', renderReturnsList);
    document.getElementById('search-returns').addEventListener('input', debounce(renderReturnsList, 300));
}

function renderReturnsList() {
    const statusFilter = document.getElementById('filter-return-status').value;
    const supplierFilter = document.getElementById('filter-return-supplier').value;
    const search = document.getElementById('search-returns').value.trim().toLowerCase();

    let returns = getReturns();
    if (statusFilter) returns = returns.filter(r => r.status === statusFilter);
    if (supplierFilter) returns = returns.filter(r => r.supplierId === supplierFilter);
    if (search) returns = returns.filter(r =>
        r.supplierName?.toLowerCase().includes(search) ||
        r.returnNumber?.toLowerCase().includes(search) ||
        (r.items || []).some(i => i.name?.toLowerCase().includes(search))
    );

    returns.sort((a, b) => new Date(b.createdAt || b.returnDate) - new Date(a.createdAt || a.returnDate));

    const container = document.getElementById('returns-list-container');
    const emptyState = document.getElementById('returns-empty-state');

    if (returns.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = returns.map(r => renderReturnCard(r)).join('');
}

function renderReturnCard(ret) {
    const statusInfo = RETURN_STATUS_LABELS[ret.status] || RETURN_STATUS_LABELS.pending;
    const reasonLabel = RETURN_REASON_LABELS[ret.reason] || ret.reason || '—';
    const itemsPreview = (ret.items || []).slice(0, 3).map(i => i.name).join(', ');
    const moreItems = (ret.items || []).length > 3 ? ` ועוד ${ret.items.length - 3}` : '';

    return `
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
        onclick="viewReturn('${ret.id}')">
        <div class="flex justify-between items-start gap-4">
            <div class="flex-grow min-w-0">
                <div class="flex items-center gap-3 mb-2 flex-wrap">
                    <span class="font-bold text-lg">${escapeHtml(ret.returnNumber || '')}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${statusInfo.cls}">${statusInfo.label}</span>
                    ${ret.orderNumber ? `<span class="text-xs text-slate-400">מהזמנה ${escapeHtml(ret.orderNumber)}</span>` : ''}
                </div>
                <p class="font-semibold text-slate-700">${escapeHtml(ret.supplierName || '')}</p>
                <p class="text-sm text-slate-500 mt-1">${formatDateHebrew(ret.returnDate)} · ${reasonLabel}</p>
                <p class="text-sm text-slate-400 mt-1 truncate">${escapeHtml(itemsPreview)}${moreItems}</p>
            </div>
            <div class="text-left shrink-0">
                <p class="text-xl font-bold text-red-600">₪${(ret.total || 0).toFixed(2)}</p>
                <p class="text-xs text-slate-400 mt-1">${(ret.items || []).length} פריטים</p>
            </div>
        </div>
    </div>`;
}

function updateReturnStats() {
    const returns = getReturns();
    document.getElementById('stat-total-returns').textContent = returns.length;
    document.getElementById('stat-pending-returns').textContent = returns.filter(r => r.status === 'pending').length;
    document.getElementById('stat-approved-returns').textContent = returns.filter(r => r.status === 'approved').length;
}

function viewReturn(returnId) {
    const ret = getReturnById(returnId);
    if (!ret) return;

    document.getElementById('view-return-number').textContent = ret.returnNumber || 'פרטי החזרה';

    const statusInfo = RETURN_STATUS_LABELS[ret.status] || RETURN_STATUS_LABELS.pending;
    const reasonLabel = RETURN_REASON_LABELS[ret.reason] || ret.reason || '—';

    const content = document.getElementById('view-return-content');
    content.innerHTML = `
        <div class="space-y-5">
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-xs text-slate-400 mb-1">ספק</p>
                    <p class="font-bold">${escapeHtml(ret.supplierName || '')}</p>
                    <p class="text-sm text-slate-500">${escapeHtml(ret.supplierPhone || '')}</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-xs text-slate-400 mb-1">סטטוס</p>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${statusInfo.cls}">${statusInfo.label}</span>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-xs text-slate-400 mb-1">תאריך</p>
                    <p class="font-bold">${formatDateHebrew(ret.returnDate)}</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-xs text-slate-400 mb-1">סיבה</p>
                    <p class="font-bold text-sm">${reasonLabel}</p>
                </div>
            </div>

            ${ret.orderNumber ? `<div class="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                <i class="fas fa-link ml-1"></i> משויך להזמנה ${escapeHtml(ret.orderNumber)}
            </div>` : ''}

            <div>
                <h4 class="font-bold mb-3">פריטים</h4>
                <div class="bg-slate-50 rounded-xl overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100">
                            <tr>
                                <th class="p-3 text-right font-medium">פריט</th>
                                <th class="p-3 text-center font-medium">כמות</th>
                                <th class="p-3 text-center font-medium">מחיר</th>
                                <th class="p-3 text-left font-medium">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(ret.items || []).map(item => `
                                <tr class="border-t border-slate-200">
                                    <td class="p-3">${escapeHtml(item.name)}</td>
                                    <td class="p-3 text-center">${item.quantity} ${item.unit}</td>
                                    <td class="p-3 text-center">₪${(item.price || 0).toFixed(2)}</td>
                                    <td class="p-3 text-left font-bold">₪${(item.total || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-red-50 rounded-xl p-4 flex justify-between items-center">
                <span class="font-bold text-red-800">סה"כ זיכוי</span>
                <span class="text-2xl font-bold text-red-700">₪${(ret.total || 0).toFixed(2)}</span>
            </div>

            ${ret.notes ? `<div class="bg-amber-50 rounded-xl p-4">
                <p class="text-sm text-amber-700 font-medium mb-1">הערות:</p>
                <p class="text-amber-800">${escapeHtml(ret.notes)}</p>
            </div>` : ''}

            <div class="border-t pt-4">
                <p class="text-xs text-slate-400 mb-3">עדכון סטטוס:</p>
                <div class="flex gap-2 flex-wrap">
                    <button onclick="updateReturnStatus('${ret.id}', 'approved')"
                        class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all">
                        <i class="fas fa-check ml-1"></i> אושרה
                    </button>
                    <button onclick="updateReturnStatus('${ret.id}', 'rejected')"
                        class="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">
                        <i class="fas fa-times ml-1"></i> נדחתה
                    </button>
                    <button onclick="resendReturn('${ret.id}')"
                        class="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button onclick="deleteReturnConfirm('${ret.id}')"
                        class="py-2 px-4 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-xl text-sm font-bold transition-all">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;

    const modal = document.getElementById('view-return-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeReturnModal() {
    const modal = document.getElementById('view-return-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function updateReturnStatus(returnId, status) {
    updateReturn(returnId, { status });
    renderReturnsList();
    updateReturnStats();
    viewReturn(returnId);
    showToast('סטטוס ההחזרה עודכן');
}

function resendReturn(returnId) {
    const ret = getReturnById(returnId);
    if (!ret) return;
    const reasonLabel = RETURN_REASON_LABELS[ret.reason] || ret.reason;
    let msg = `שלום ${ret.supplierName},\n\nהחזרת סחורה ${ret.returnNumber}\nתאריך: ${formatDateHebrew(ret.returnDate)}\nסיבה: ${reasonLabel}\n\nפריטים:\n`;
    (ret.items || []).forEach((item, i) => {
        msg += `${i + 1}. ${item.name} — ${item.quantity} ${item.unit}\n`;
    });
    msg += `\nסה"כ זיכוי: ₪${(ret.total || 0).toFixed(2)}\nתודה!`;
    sendWhatsAppMessage(ret.supplierPhone, msg);
}

function deleteReturnConfirm(returnId) {
    const ret = getReturnById(returnId);
    if (!ret) return;
    if (!confirm(`האם למחוק את ההחזרה ${ret.returnNumber}?`)) return;
    deleteReturn(returnId);
    closeReturnModal();
    renderReturnsList();
    updateReturnStats();
    showToast('ההחזרה נמחקה');
}

Object.assign(window, {
    viewReturn, closeReturnModal,
    updateReturnStatus, resendReturn, deleteReturnConfirm
});
