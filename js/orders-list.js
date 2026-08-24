/**
 * Vegetable Orders Management - Orders List Page Logic
 * Handles displaying and managing the orders list.
 */

import { getSuppliers, getOrders, getOrderById, updateOrder, deleteOrder, getPriceCatalog } from './storage.js';
import { showToast, escapeHtml, escapeAttr, formatDateHebrew, getStatusBadgeHtml, buildOrderMessage } from './utils.js';
import { sendWhatsAppMessage, sendSMSMessage, showGroupPicker } from './messaging.js';
import './theme.js';
import './sync.js';

document.addEventListener('DOMContentLoaded', () => {
    initOrdersListPage();
    document.getElementById('close-view-modal-btn')?.addEventListener('click', closeViewModal);
});

/**
 * Initializes the orders list page.
 */
function initOrdersListPage() {
    populateSupplierFilter();
    setupFilters();
    renderOrdersList();
    updateStats();
}

function populateSupplierFilter() {
    // No longer needed — supplier filter is now autocomplete
}

/**
 * Sets up filter event listeners.
 */
function setupFilters() {
    const statusFilter   = document.getElementById('filter-status');
    const supplierInput  = document.getElementById('filter-supplier');
    const clearBtn       = document.getElementById('clear-supplier-btn');
    const suggestions    = document.getElementById('supplier-suggestions');
    const clearFolderBtn = document.getElementById('clear-folder-btn');

    statusFilter.addEventListener('change', renderOrdersList);

    supplierInput.addEventListener('input', () => {
        const q = supplierInput.value.trim();
        clearBtn?.classList.toggle('hidden', !q);
        showSupplierSuggestions(q);
        renderOrdersList();
    });

    supplierInput.addEventListener('focus', () => {
        const q = supplierInput.value.trim();
        if (q) showSupplierSuggestions(q);
    });

    supplierInput.addEventListener('blur', () => {
        setTimeout(hideSuggestions, 200);
    });

    clearBtn?.addEventListener('click', clearSupplierFilter);
    clearFolderBtn?.addEventListener('click', clearSupplierFilter);

    suggestions?.addEventListener('mousedown', e => {
        const btn = e.target.closest('[data-supplier]');
        if (btn) selectSupplierFilter(btn.dataset.supplier);
    });
}

function showSupplierSuggestions(query) {
    const suggestions = document.getElementById('supplier-suggestions');
    if (!suggestions) return;
    if (!query) { suggestions.classList.add('hidden'); return; }

    const suppliers = getSuppliers();
    const q = query.toLowerCase();
    const matches = suppliers.filter(s => s.name.toLowerCase().includes(q));
    if (matches.length === 0) { suggestions.classList.add('hidden'); return; }

    suggestions.innerHTML = matches.map(s => `
        <button class="w-full text-right px-4 py-2.5 hover:bg-emerald-50 text-slate-700 flex items-center gap-2 transition-colors text-sm"
            data-supplier="${escapeAttr(s.name)}">
            <i class="fas fa-truck text-emerald-500 text-xs flex-shrink-0"></i>
            <span>${escapeHtml(s.name)}</span>
        </button>
    `).join('');
    suggestions.classList.remove('hidden');
}

function hideSuggestions() {
    document.getElementById('supplier-suggestions')?.classList.add('hidden');
}

function selectSupplierFilter(name) {
    const input = document.getElementById('filter-supplier');
    if (input) input.value = name;
    document.getElementById('clear-supplier-btn')?.classList.remove('hidden');
    hideSuggestions();
    renderOrdersList();
}

function clearSupplierFilter() {
    const input = document.getElementById('filter-supplier');
    if (input) input.value = '';
    document.getElementById('clear-supplier-btn')?.classList.add('hidden');
    const fh = document.getElementById('supplier-folder-header');
    if (fh) { fh.classList.add('hidden'); fh.classList.remove('flex'); }
    hideSuggestions();
    renderOrdersList();
}

function renderOrderCard(order) {
    const draftBorder = order.status === 'draft' ? ' border-amber-200' : '';
    return `
        <div class="bg-white border border-slate-100${draftBorder} rounded-2xl p-5 hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <span class="text-lg font-bold text-slate-900">${escapeHtml(order.supplierName || 'ספק לא ידוע')}</span>
                    ${order.mainHallName ? `<p class="text-xs text-emerald-600 font-medium mt-0.5"><i class="fas fa-door-open ml-1"></i>${escapeHtml(order.mainHallName)}</p>` : ''}
                </div>
                ${getStatusBadgeHtml(order.status)}
            </div>
            <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-500">תאריך הזמנה:</span>
                    <span class="font-medium">${formatDateHebrew(order.orderDate)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">תאריך אספקה:</span>
                    <span class="font-medium">${formatDateHebrew(order.deliveryDate)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">פריטים:</span>
                    <span class="font-medium">${order.items ? order.items.length : 0}</span>
                </div>
            </div>
            <div class="bg-emerald-50 rounded-xl p-3 mb-4 text-center">
                ${order.actualTotal != null ? `
                    <p class="text-xs text-slate-400 line-through">הוזמן: ₪${(order.total || 0).toFixed(2)}</p>
                    <p class="text-sm text-emerald-600">סה"כ בפועל</p>
                    <p class="text-2xl font-bold text-emerald-700">₪${(order.actualTotal || 0).toFixed(2)}</p>
                ` : `
                    <p class="text-sm text-emerald-600">סה"כ</p>
                    <p class="text-2xl font-bold text-emerald-700">₪${(order.total || 0).toFixed(2)}</p>
                `}
            </div>
            <div class="flex gap-2">
                <button onclick="viewOrder('${order.id}')"
                    class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1"
                    title="צפה בהזמנה">
                    <i class="fas fa-eye"></i>
                    <span class="hidden sm:inline">צפה</span>
                </button>
                ${order.status === 'draft' ? `
                <button onclick="window.location.href='new-order.html?editOrder=${order.id}'"
                    class="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-all"
                    title="ערוך טיוטה">
                    <i class="fas fa-edit"></i>
                </button>` : `
                <button onclick="window.location.href='new-order.html?addTo=${order.id}'"
                    class="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-all"
                    title="הוסף פריטים להזמנה">
                    <i class="fas fa-plus"></i>
                </button>`}
                <button onclick="resendWhatsApp('${order.id}')"
                    class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all"
                    title="שלח ב-WhatsApp לספק">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button onclick="resendWhatsAppGroup('${order.id}')"
                    class="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-all"
                    title="שלח לקבוצת WhatsApp">
                    <i class="fab fa-whatsapp"></i><i class="fas fa-users text-xs mr-0.5"></i>
                </button>
                <button onclick="resendSMS('${order.id}')"
                    class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all"
                    title="שלח ב-SMS">
                    <i class="fas fa-comment-sms"></i>
                </button>
                <button onclick="deleteOrderConfirm('${order.id}')"
                    class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all"
                    title="מחק הזמנה">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders the orders list with current filters.
 */
function renderOrdersList() {
    const orders = getFilteredOrders();
    const ordersGrid = document.getElementById('orders-grid');
    const emptyState = document.getElementById('empty-state');
    const supplierFilter = (document.getElementById('filter-supplier')?.value || '').trim();
    const statusFilter   = document.getElementById('filter-status')?.value || '';
    const folderHeader   = document.getElementById('supplier-folder-header');

    // Supplier folder header
    if (supplierFilter && folderHeader) {
        folderHeader.classList.remove('hidden');
        folderHeader.classList.add('flex');
        const nameEl  = document.getElementById('folder-supplier-name');
        const countEl = document.getElementById('folder-orders-count');
        if (nameEl)  nameEl.textContent  = supplierFilter;
        if (countEl) countEl.textContent = `${orders.length} הזמנות`;
    } else if (folderHeader) {
        folderHeader.classList.add('hidden');
        folderHeader.classList.remove('flex');
    }

    if (orders.length === 0) {
        emptyState.classList.remove('hidden');
        ordersGrid.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // When showing all statuses, group drafts at the top
    if (!statusFilter) {
        const drafts = orders.filter(o => o.status === 'draft');
        const others  = orders.filter(o => o.status !== 'draft');
        let html = '';
        if (drafts.length > 0) {
            html += `
                <div class="col-span-full">
                    <div class="flex items-center gap-2 text-amber-700 mb-3">
                        <i class="fas fa-pen-to-square"></i>
                        <span class="font-bold text-sm">טיוטות (${drafts.length})</span>
                        <div class="flex-1 h-px bg-amber-200"></div>
                    </div>
                </div>
                ${drafts.map(o => renderOrderCard(o)).join('')}
            `;
        }
        if (others.length > 0) {
            if (drafts.length > 0) {
                html += `
                    <div class="col-span-full">
                        <div class="flex items-center gap-2 text-slate-500 mt-2 mb-3">
                            <i class="fas fa-list-ul"></i>
                            <span class="font-bold text-sm">הזמנות</span>
                            <div class="flex-1 h-px bg-slate-200"></div>
                        </div>
                    </div>
                `;
            }
            html += others.map(o => renderOrderCard(o)).join('');
        }
        ordersGrid.innerHTML = html;
    } else {
        ordersGrid.innerHTML = orders.map(o => renderOrderCard(o)).join('');
    }
}

/**
 * Gets filtered orders based on current filter values.
 * @returns {Array} Filtered orders
 */
function getFilteredOrders() {
    let orders = getOrders();

    const statusFilter   = document.getElementById('filter-status').value;
    const supplierFilter = (document.getElementById('filter-supplier')?.value || '').trim().toLowerCase();

    if (statusFilter) {
        orders = orders.filter(o => o.status === statusFilter);
    }

    if (supplierFilter) {
        orders = orders.filter(o => (o.supplierName || '').toLowerCase().includes(supplierFilter));
    }

    return orders;
}


/**
 * Updates the stats display.
 */
function updateStats() {
    const orders = getOrders();

    document.getElementById('stat-total').textContent = orders.length;
    document.getElementById('stat-draft').textContent = orders.filter(o => o.status === 'draft').length;
    document.getElementById('stat-sent').textContent = orders.filter(o => o.status === 'sent').length;
    document.getElementById('stat-delivered').textContent = orders.filter(o => o.status === 'delivered').length;
}

/**
 * Views an order in a modal.
 * @param {string} orderId
 */
function viewOrder(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const titleEl = document.getElementById('view-modal-title');
    if (titleEl) titleEl.textContent = `הזמנה — ${order.supplierName || ''}`;

    const content = document.getElementById('view-order-content');
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Order Info -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-sm text-slate-500 mb-1">ספק</p>
                    <p class="font-bold">${order.supplierName || '-'}</p>
                    <p class="text-sm text-slate-500">${order.supplierPhone || '-'}</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                    ${getStatusBadgeHtml(order.status)}
                    ${order.hall ? `<p class="text-sm font-bold text-emerald-700"><i class="fas fa-door-open ml-1"></i>${order.hall}</p>` : ''}
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-sm text-slate-500 mb-1">תאריך הזמנה</p>
                    <p class="font-bold">${formatDateHebrew(order.orderDate)}</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <p class="text-sm text-slate-500 mb-1">תאריך אספקה</p>
                    <p class="font-bold">${formatDateHebrew(order.deliveryDate)}</p>
                </div>
            </div>

            <!-- Items -->
            <div>
                <h4 class="font-bold mb-3">פריטים בהזמנה</h4>
                <div class="bg-slate-50 rounded-xl overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100">
                            <tr>
                                <th class="p-3 text-right font-medium">פריט</th>
                                <th class="p-3 text-center font-medium">כמות</th>
                                <th class="p-3 text-center font-medium">מחיר הזמנה</th>
                                <th class="p-3 text-center font-medium">מחיר בפועל</th>
                                <th class="p-3 text-left font-medium">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(order.items || []).map(item => {
                                const displayPrice = item.actualPrice != null ? item.actualPrice : item.price;
                                const displayTotal = item.actualTotal != null ? item.actualTotal : item.total;
                                const hasDiff = item.actualPrice != null && Math.abs(item.actualPrice - item.price) > 0.001;
                                return `
                                <tr class="border-t border-slate-200">
                                    <td class="p-3">${item.name}</td>
                                    <td class="p-3 text-center">${item.quantity} ${item.unit}</td>
                                    <td class="p-3 text-center text-slate-500">₪${(item.price || 0).toFixed(2)}</td>
                                    <td class="p-3 text-center font-bold ${hasDiff ? 'text-amber-600' : 'text-slate-700'}">
                                        ₪${(displayPrice || 0).toFixed(2)}
                                        ${hasDiff ? '<i class="fas fa-pen text-xs mr-1 opacity-60"></i>' : ''}
                                    </td>
                                    <td class="p-3 text-left font-bold">₪${(displayTotal || 0).toFixed(2)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Total -->
            ${order.actualTotal != null ? `
            <div class="space-y-2">
                <div class="bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span class="text-sm text-slate-500">מחיר הוזמן</span>
                    <span class="text-lg text-slate-400 line-through">₪${(order.total || 0).toFixed(2)}</span>
                </div>
                <div class="bg-emerald-100 rounded-xl p-4 flex justify-between items-center">
                    <span class="font-bold text-emerald-800">סה"כ בפועל</span>
                    <span class="text-2xl font-bold text-emerald-700">₪${(order.actualTotal || 0).toFixed(2)}</span>
                </div>
            </div>` : `
            <div class="bg-emerald-100 rounded-xl p-4 flex justify-between items-center">
                <span class="font-bold text-emerald-800">סה"כ להזמנה</span>
                <span class="text-2xl font-bold text-emerald-700">₪${(order.total || 0).toFixed(2)}</span>
            </div>`}

            <!-- Notes -->
            ${order.notes ? `
                <div class="bg-amber-50 rounded-xl p-4">
                    <p class="text-sm text-amber-700 font-medium mb-1">הערות:</p>
                    <p class="text-amber-800">${escapeHtml(order.notes)}</p>
                </div>
            ` : ''}

            <!-- Actions -->
            <div class="flex gap-2 pt-4 border-t flex-wrap">
                <button
                    onclick="updateOrderStatus('${order.id}', 'delivered'); closeViewModal();"
                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all min-w-[100px]"
                >
                    <i class="fas fa-check ml-2"></i>
                    סופק
                </button>
                <button
                    onclick="updateOrderStatus('${order.id}', 'not_delivered'); closeViewModal();"
                    class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all min-w-[100px]"
                >
                    <i class="fas fa-times ml-2"></i>
                    לא סופק
                </button>
                <button
                    onclick="editDeliveryDetails('${order.id}')"
                    class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-2"
                    title="עריכת קבלה — כמות ומחיר בפועל"
                >
                    <i class="fas fa-scale-balanced"></i>
                    <span class="text-sm">עריכת קבלה</span>
                </button>
                <button
                    onclick="resendWhatsApp('${order.id}')"
                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl transition-all"
                    title="שלח WhatsApp לספק"
                >
                    <i class="fab fa-whatsapp text-xl"></i>
                </button>
                <button
                    onclick="resendWhatsAppGroup('${order.id}')"
                    class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-xl transition-all flex items-center gap-1"
                    title="שלח לקבוצת WhatsApp"
                >
                    <i class="fab fa-whatsapp text-xl"></i>
                    <span class="text-sm font-medium">קבוצה</span>
                </button>
                <button
                    onclick="resendSMS('${order.id}')"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl transition-all"
                    title="שלח SMS"
                >
                    <i class="fas fa-comment-sms text-xl"></i>
                </button>
            </div>
        </div>
    `;

    const modal = document.getElementById('view-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Closes the view modal.
 */
function closeViewModal() {
    const modal = document.getElementById('view-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Updates order status.
 * @param {string} orderId
 * @param {string} status
 */
function updateOrderStatus(orderId, status) {
    updateOrder(orderId, { status });
    renderOrdersList();
    updateStats();
    showToast('סטטוס ההזמנה עודכן');
}

/**
 * Resends order via WhatsApp.
 * @param {string} orderId
 */
function resendWhatsApp(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const message = buildOrderMessage(order);
    sendWhatsAppMessage(order.supplierPhone, message);

    // Update status to sent if it was draft
    if (order.status === 'draft') {
        updateOrderStatus(orderId, 'sent');
    }
}

/**
 * Sends order to a WhatsApp group (user picks the group).
 * @param {string} orderId
 */
function resendWhatsAppGroup(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;
    const message = buildOrderMessage(order);
    showGroupPicker(message);
    if (order.status === 'draft') {
        updateOrderStatus(orderId, 'sent');
    }
}

/**
 * Resends order via SMS.
 * @param {string} orderId
 */
function resendSMS(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const message = buildOrderMessage(order);
    sendSMSMessage(order.supplierPhone, message);

    // Update status to sent if it was draft
    if (order.status === 'draft') {
        updateOrderStatus(orderId, 'sent');
    }
}

/**
 * Confirms and deletes an order.
 * @param {string} orderId
 */
function deleteOrderConfirm(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const confirmed = confirm(`האם אתה בטוח שברצונך למחוק הזמנה של ${order.supplierName || 'ספק לא ידוע'}?`);
    if (!confirmed) return;

    deleteOrder(orderId);
    renderOrdersList();
    updateStats();
    showToast('ההזמנה נמחקה');
}

function resolveItemPackageSize(item) {
    if (parseFloat(item.packageSize) > 0) return parseFloat(item.packageSize);
    // Fallback: look up current catalog by item name
    const catalog = getPriceCatalog();
    const entry = catalog.find(c => c.name === item.name);
    return parseFloat(entry?.packageSize) || 0;
}

function editDeliveryDetails(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const rows = (order.items || []).map((item, i) => {
        const packageSize  = resolveItemPackageSize(item);
        // Derive pricePerUnit: stored field, or divide carton price by packageSize, or fallback to price
        const pricePerUnit = item.pricePerUnit > 0 ? item.pricePerUnit
            : (packageSize > 0 ? (item.price || 0) / packageSize : (item.price || 0));

        if (packageSize > 0) {
            // Carton item — show cartons + weight adjustment
            const recvCartons = item.receivedQty  != null ? item.receivedQty  : item.quantity;
            const weightAdj   = item.weightAdjustment != null ? item.weightAdjustment : 0;
            const actualPPU   = item.actualPrice != null ? item.actualPrice : pricePerUnit;
            const netWeight   = recvCartons * packageSize + weightAdj;
            const rowTotal    = netWeight * actualPPU;
            return `
        <tr class="border-t border-slate-200" id="delivery-row-${i}"
            data-package-size="${packageSize}" data-price-per-unit="${pricePerUnit}">
            <td class="p-2 font-medium text-sm">${escapeHtml(item.name)}</td>
            <td class="p-2 text-center text-slate-400 text-xs">${item.quantity} ${item.unit}</td>
            <td class="p-2 text-center">
                <div class="flex flex-col items-center gap-1">
                    <div class="flex items-center gap-1">
                        <input type="number" min="0" step="1" inputmode="decimal"
                            id="recv-qty-${i}"
                            value="${recvCartons}"
                            oninput="recalcDeliveryRow(${i})"
                            class="w-16 text-center border-2 border-orange-300 rounded-lg px-1 py-1 text-sm font-bold focus:outline-none focus:border-orange-500 bg-orange-50">
                        <span class="text-xs text-slate-500">${escapeHtml(item.unit)}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <input type="number" step="0.1" inputmode="decimal"
                            id="weight-adj-${i}"
                            value="${weightAdj}"
                            oninput="recalcDeliveryRow(${i})"
                            class="w-16 text-center border-2 border-purple-300 rounded-lg px-1 py-1 text-xs font-bold focus:outline-none focus:border-purple-500 bg-purple-50"
                            placeholder="±ק&quot;ג">
                        <span class="text-xs text-slate-400">±ק"ג</span>
                    </div>
                </div>
            </td>
            <td class="p-2 text-center">
                <div class="flex flex-col items-center gap-0.5">
                    <div class="flex items-center gap-0.5">
                        <span class="text-slate-400 text-xs">₪</span>
                        <input type="number" min="0" step="0.01" inputmode="decimal"
                            id="actual-price-${i}"
                            value="${actualPPU.toFixed(2)}"
                            oninput="recalcDeliveryRow(${i})"
                            class="w-16 text-center border-2 border-amber-300 rounded-lg px-1 py-1 text-sm font-bold focus:outline-none focus:border-amber-500 bg-amber-50">
                    </div>
                    <span class="text-xs text-slate-400">לק"ג</span>
                </div>
            </td>
            <td class="p-2 text-center font-bold text-emerald-700 text-sm" id="delivery-total-${i}">
                ₪${rowTotal.toFixed(2)}
                <div class="text-xs text-slate-400 font-normal">${netWeight.toFixed(1)} ק"ג</div>
            </td>
        </tr>`;
        } else {
            // Regular item — original behavior
            const recvQty    = item.receivedQty != null ? item.receivedQty : item.quantity;
            const actualPrice = item.actualPrice != null ? item.actualPrice : (item.price || 0);
            const rowTotal   = recvQty * actualPrice;
            return `
        <tr class="border-t border-slate-200" id="delivery-row-${i}" data-package-size="0">
            <td class="p-2 font-medium text-sm">${escapeHtml(item.name)}</td>
            <td class="p-2 text-center text-slate-400 text-xs">${item.quantity} ${item.unit}</td>
            <td class="p-2 text-center">
                <input type="number" min="0" step="0.5" inputmode="decimal"
                    id="recv-qty-${i}"
                    data-unit="${item.unit}"
                    value="${recvQty}"
                    oninput="recalcDeliveryRow(${i})"
                    class="w-20 text-center border-2 border-orange-300 rounded-lg px-1 py-1.5 text-sm font-bold focus:outline-none focus:border-orange-500 bg-orange-50">
            </td>
            <td class="p-2 text-center">
                <div class="flex items-center justify-center gap-0.5">
                    <span class="text-slate-400 text-xs">₪</span>
                    <input type="number" min="0" step="0.01" inputmode="decimal"
                        id="actual-price-${i}"
                        value="${actualPrice.toFixed(2)}"
                        oninput="recalcDeliveryRow(${i})"
                        class="w-20 text-center border-2 border-amber-300 rounded-lg px-1 py-1.5 text-sm font-bold focus:outline-none focus:border-amber-500 bg-amber-50">
                </div>
            </td>
            <td class="p-2 text-center font-bold text-emerald-700 text-sm" id="delivery-total-${i}">₪${rowTotal.toFixed(2)}</td>
        </tr>`;
        }
    }).join('');

    const grandTotal = calcDeliveryGrandTotal(order.items || []);

    const content = document.getElementById('view-order-content');
    content.innerHTML = `
        <div class="space-y-4">
            <p class="text-sm text-slate-500">עדכן כמות שהתקבלה ומחיר בפועל — הסה"כ מתעדכן אוטומטית:</p>
            <div class="bg-slate-50 rounded-xl overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-2 text-right font-medium">פריט</th>
                            <th class="p-2 text-center font-medium text-slate-400">הוזמן</th>
                            <th class="p-2 text-center font-medium text-orange-600">קיבלתי</th>
                            <th class="p-2 text-center font-medium text-amber-600">מחיר ₪</th>
                            <th class="p-2 text-center font-medium">סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
                <span class="font-bold text-emerald-800">סה"כ בפועל</span>
                <span class="text-2xl font-bold text-emerald-700" id="delivery-grand-total">₪${grandTotal.toFixed(2)}</span>
            </div>
            <div class="flex gap-3 pt-2">
                <button onclick="saveDeliveryDetails('${orderId}')"
                    class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all">
                    <i class="fas fa-save ml-2"></i>שמור
                </button>
                <button onclick="viewOrder('${orderId}')"
                    class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all">
                    ביטול
                </button>
            </div>
        </div>`;
}

function calcDeliveryGrandTotal(items) {
    return (items || []).reduce((sum, item) => {
        const packageSize  = parseFloat(item.packageSize) || 0;
        const pricePerUnit = item.pricePerUnit > 0 ? item.pricePerUnit
            : (packageSize > 0 ? (item.price || 0) / packageSize : (item.price || 0));
        if (packageSize > 0) {
            const cartons   = item.receivedQty != null ? item.receivedQty : (item.quantity || 0);
            const adj       = item.weightAdjustment || 0;
            const ppu       = item.actualPrice != null ? item.actualPrice : pricePerUnit;
            return sum + (cartons * packageSize + adj) * ppu;
        } else {
            const qty   = item.receivedQty != null ? item.receivedQty  : (item.quantity || 0);
            const price = item.actualPrice != null ? item.actualPrice : (item.price || 0);
            return sum + qty * price;
        }
    }, 0);
}

function recalcDeliveryRow(rowIndex) {
    const row      = document.getElementById(`delivery-row-${rowIndex}`);
    const totalEl  = document.getElementById(`delivery-total-${rowIndex}`);
    const qtyInput = document.getElementById(`recv-qty-${rowIndex}`);
    const priceInput = document.getElementById(`actual-price-${rowIndex}`);
    if (!row || !totalEl || !qtyInput || !priceInput) return;

    const packageSize = parseFloat(row.dataset.packageSize) || 0;
    let rowTotal = 0;

    if (packageSize > 0) {
        const adjInput  = document.getElementById(`weight-adj-${rowIndex}`);
        const cartons   = parseFloat(qtyInput.value) || 0;
        const adj       = parseFloat(adjInput?.value) || 0;
        const ppu       = parseFloat(priceInput.value) || 0;
        const netWeight = cartons * packageSize + adj;
        rowTotal = netWeight * ppu;
        totalEl.innerHTML = `₪${rowTotal.toFixed(2)}<div class="text-xs text-slate-400 font-normal">${netWeight.toFixed(1)} ק"ג</div>`;
    } else {
        const qty   = parseFloat(qtyInput.value)   || 0;
        const price = parseFloat(priceInput.value)  || 0;
        rowTotal = qty * price;
        totalEl.textContent = '₪' + rowTotal.toFixed(2);
    }

    // Recalc grand total
    let grand = 0;
    let i = 0;
    while (document.getElementById(`delivery-row-${i}`)) {
        const r  = document.getElementById(`delivery-row-${i}`);
        const ps = parseFloat(r?.dataset.packageSize) || 0;
        const q  = parseFloat(document.getElementById(`recv-qty-${i}`)?.value) || 0;
        const p  = parseFloat(document.getElementById(`actual-price-${i}`)?.value) || 0;
        if (ps > 0) {
            const a = parseFloat(document.getElementById(`weight-adj-${i}`)?.value) || 0;
            grand += (q * ps + a) * p;
        } else {
            grand += q * p;
        }
        i++;
    }
    const grandEl = document.getElementById('delivery-grand-total');
    if (grandEl) grandEl.textContent = '₪' + grand.toFixed(2);
}

function saveDeliveryDetails(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const updatedItems = (order.items || []).map((item, i) => {
        const qtyInput   = document.getElementById(`recv-qty-${i}`);
        const priceInput = document.getElementById(`actual-price-${i}`);
        const adjInput   = document.getElementById(`weight-adj-${i}`);
        const packageSize = resolveItemPackageSize(item);

        const receivedQty = qtyInput ? (parseFloat(qtyInput.value) || 0) : (item.receivedQty ?? item.quantity);
        const actualPrice = priceInput ? (parseFloat(priceInput.value) || 0) : (item.actualPrice ?? item.price);

        let actualTotal, weightAdjustment;
        if (packageSize > 0) {
            weightAdjustment = adjInput ? (parseFloat(adjInput.value) || 0) : (item.weightAdjustment || 0);
            actualTotal = (receivedQty * packageSize + weightAdjustment) * actualPrice;
        } else {
            weightAdjustment = 0;
            actualTotal = receivedQty * actualPrice;
        }

        return { ...item, receivedQty, actualPrice, actualTotal, weightAdjustment };
    });

    const newActualTotal = updatedItems.reduce((sum, it) => sum + (it.actualTotal || 0), 0);
    updateOrder(orderId, { items: updatedItems, actualTotal: newActualTotal });
    viewOrder(orderId);
    showToast('פרטי הקבלה עודכנו ✓');
}

Object.assign(window, {
    viewOrder, closeViewModal, updateOrderStatus,
    resendWhatsApp, resendWhatsAppGroup, resendSMS, deleteOrderConfirm,
    editDeliveryDetails, recalcDeliveryRow, saveDeliveryDetails,
    clearSupplierFilter
});
