/**
 * Vegetable Orders Management - Orders List Page Logic
 * Handles displaying and managing the orders list.
 */

document.addEventListener('DOMContentLoaded', () => {
    initOrdersListPage();
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

/**
 * Populates the supplier filter dropdown.
 */
function populateSupplierFilter() {
    const select = document.getElementById('filter-supplier');
    const suppliers = getSuppliers();

    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.name;
        select.appendChild(option);
    });
}

/**
 * Sets up filter event listeners.
 */
function setupFilters() {
    const statusFilter = document.getElementById('filter-status');
    const supplierFilter = document.getElementById('filter-supplier');
    const searchInput = document.getElementById('search-orders');

    statusFilter.addEventListener('change', renderOrdersList);
    supplierFilter.addEventListener('change', renderOrdersList);
    searchInput.addEventListener('input', debounce(renderOrdersList, 300));
}

/**
 * Renders the orders list with current filters.
 */
function renderOrdersList() {
    const orders = getFilteredOrders();
    const ordersGrid = document.getElementById('orders-grid');
    const emptyState = document.getElementById('empty-state');

    if (orders.length === 0) {
        emptyState.classList.remove('hidden');
        ordersGrid.innerHTML = '';
        return;
    }

    emptyState.classList.add('hidden');

    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    ordersGrid.innerHTML = orders.map(order => `
        <div class="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all">
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <span class="text-lg font-bold text-slate-900">${order.orderNumber || '#---'}</span>
                    <p class="text-sm text-slate-500">${order.supplierName || 'ספק לא ידוע'}</p>
                    ${order.hall ? `<p class="text-xs text-emerald-600 font-medium mt-0.5"><i class="fas fa-door-open ml-1"></i>${order.hall}</p>` : ''}
                </div>
                ${getStatusBadgeHtml(order.status)}
            </div>

            <!-- Details -->
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

            <!-- Total -->
            <div class="bg-emerald-50 rounded-xl p-3 mb-4 text-center">
                <p class="text-sm text-emerald-600">סה"כ</p>
                <p class="text-2xl font-bold text-emerald-700">₪${(order.total || 0).toFixed(2)}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
                <button
                    onclick="viewOrder('${order.id}')"
                    class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1"
                    title="צפה בהזמנה"
                >
                    <i class="fas fa-eye"></i>
                    <span class="hidden sm:inline">צפה</span>
                </button>
                <button
                    onclick="resendWhatsApp('${order.id}')"
                    class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all"
                    title="שלח ב-WhatsApp לספק"
                >
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button
                    onclick="resendWhatsAppGroup('${order.id}')"
                    class="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-all"
                    title="שלח לקבוצת WhatsApp"
                >
                    <i class="fab fa-whatsapp"></i><i class="fas fa-users text-xs mr-0.5"></i>
                </button>
                <button
                    onclick="resendSMS('${order.id}')"
                    class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all"
                    title="שלח ב-SMS"
                >
                    <i class="fas fa-comment-sms"></i>
                </button>
                <button
                    onclick="deleteOrderConfirm('${order.id}')"
                    class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all"
                    title="מחק הזמנה"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Gets filtered orders based on current filter values.
 * @returns {Array} Filtered orders
 */
function getFilteredOrders() {
    let orders = getOrders();

    const statusFilter = document.getElementById('filter-status').value;
    const supplierFilter = document.getElementById('filter-supplier').value;
    const searchTerm = document.getElementById('search-orders').value.trim().toLowerCase();

    if (statusFilter) {
        orders = orders.filter(o => o.status === statusFilter);
    }

    if (supplierFilter) {
        orders = orders.filter(o => o.supplierId === supplierFilter);
    }

    if (searchTerm) {
        orders = orders.filter(o =>
            (o.orderNumber && o.orderNumber.toLowerCase().includes(searchTerm)) ||
            (o.supplierName && o.supplierName.toLowerCase().includes(searchTerm)) ||
            (o.notes && o.notes.toLowerCase().includes(searchTerm))
        );
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

    document.getElementById('view-order-number').textContent = order.orderNumber;

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
                                <th class="p-3 text-center font-medium">מחיר</th>
                                <th class="p-3 text-left font-medium">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(order.items || []).map(item => `
                                <tr class="border-t border-slate-200">
                                    <td class="p-3">${item.name}</td>
                                    <td class="p-3 text-center">${item.quantity} ${item.unit}</td>
                                    <td class="p-3 text-center">₪${(item.price || 0).toFixed(2)}</td>
                                    <td class="p-3 text-left font-bold">₪${(item.total || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Total -->
            <div class="bg-emerald-100 rounded-xl p-4 flex justify-between items-center">
                <span class="font-bold text-emerald-800">סה"כ להזמנה</span>
                <span class="text-2xl font-bold text-emerald-700">₪${(order.total || 0).toFixed(2)}</span>
            </div>

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
                    סמן כסופק
                </button>
                <button
                    onclick="editReceivedQuantities('${order.id}')"
                    class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-3 rounded-xl transition-all"
                    title="עריכת כמויות שהתקבלו"
                >
                    <i class="fas fa-scale-balanced"></i>
                </button>
                <button
                    onclick="editOrderPrices('${order.id}')"
                    class="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-3 rounded-xl transition-all"
                    title="תיקון מחיר"
                >
                    <i class="fas fa-shekel-sign"></i>
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
    sendToWhatsAppGroup(message);

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

    const confirmed = confirm(`האם אתה בטוח שברצונך למחוק את הזמנה ${order.orderNumber}?`);
    if (!confirmed) return;

    deleteOrder(orderId);
    renderOrdersList();
    updateStats();
    showToast('ההזמנה נמחקה');
}

function editReceivedQuantities(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const rows = (order.items || []).map((item, i) => `
        <tr class="border-t border-slate-200">
            <td class="p-3">${escapeHtml(item.name)}</td>
            <td class="p-3 text-center text-slate-500">${item.quantity} ${item.unit}</td>
            <td class="p-3 text-center">
                <input type="number" min="0" step="0.5"
                    id="recv-qty-${i}"
                    value="${(item.receivedQty != null ? item.receivedQty : item.quantity)}"
                    class="w-20 text-center border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-500">
                <span class="text-xs text-slate-500 mr-1">${item.unit}</span>
            </td>
        </tr>`).join('');

    const content = document.getElementById('view-order-content');
    content.innerHTML = `
        <div class="space-y-4">
            <p class="text-sm text-slate-500">הזן את הכמות שהתקבלה בפועל לכל פריט:</p>
            <div class="bg-slate-50 rounded-xl overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 text-right font-medium">פריט</th>
                            <th class="p-3 text-center font-medium">הוזמן</th>
                            <th class="p-3 text-center font-medium">התקבל</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="flex gap-3 pt-2">
                <button onclick="saveReceivedQuantities('${orderId}')"
                    class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all">
                    <i class="fas fa-save ml-2"></i>שמור כמויות
                </button>
                <button onclick="viewOrder('${orderId}')"
                    class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all">
                    ביטול
                </button>
            </div>
        </div>`;
}

function saveReceivedQuantities(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const updatedItems = (order.items || []).map((item, i) => {
        const input = document.getElementById(`recv-qty-${i}`);
        const receivedQty = input ? parseFloat(input.value) || 0 : item.quantity;
        return { ...item, receivedQty };
    });

    updateOrder(orderId, { items: updatedItems });
    viewOrder(orderId);
    showToast('הכמויות שהתקבלו עודכנו');
}

function editOrderPrices(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const rows = (order.items || []).map((item, i) => `
        <tr class="border-t border-slate-200">
            <td class="p-3">${escapeHtml(item.name)}</td>
            <td class="p-3 text-center text-slate-500">${item.quantity} ${item.unit}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1">
                    <input type="number" min="0" step="0.01"
                        id="edit-price-${i}"
                        value="${(item.price || 0).toFixed(2)}"
                        class="w-24 text-center border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-amber-500">
                    <span class="text-xs text-slate-500">₪</span>
                </div>
            </td>
        </tr>`).join('');

    const content = document.getElementById('view-order-content');
    content.innerHTML = `
        <div class="space-y-4">
            <p class="text-sm text-slate-500">עדכן את המחיר בפועל לכל פריט:</p>
            <div class="bg-slate-50 rounded-xl overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-3 text-right font-medium">פריט</th>
                            <th class="p-3 text-center font-medium">כמות</th>
                            <th class="p-3 text-center font-medium">מחיר לק"ג</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="flex gap-3 pt-2">
                <button onclick="saveOrderPrices('${orderId}')"
                    class="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all">
                    <i class="fas fa-save ml-2"></i>שמור מחירים
                </button>
                <button onclick="viewOrder('${orderId}')"
                    class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all">
                    ביטול
                </button>
            </div>
        </div>`;
}

function saveOrderPrices(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const updatedItems = (order.items || []).map((item, i) => {
        const input = document.getElementById(`edit-price-${i}`);
        const price = input ? parseFloat(input.value) || 0 : item.price;
        const total = price * (item.quantity || 0);
        return { ...item, price, total };
    });

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    updateOrder(orderId, { items: updatedItems, total: newTotal });
    viewOrder(orderId);
    showToast('המחירים עודכנו');
}

Object.assign(window, {
    viewOrder, closeViewModal, updateOrderStatus,
    resendWhatsApp, resendWhatsAppGroup, resendSMS, deleteOrderConfirm,
    editReceivedQuantities, saveReceivedQuantities,
    editOrderPrices, saveOrderPrices
});
