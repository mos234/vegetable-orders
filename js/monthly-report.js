/**
 * Vegetable Orders Management - Monthly Report Page Logic
 * Handles displaying monthly expense reports.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMonthlyReportPage();
});

/**
 * Initializes the monthly report page.
 */
function initMonthlyReportPage() {
    setDefaultMonth();
    setupEventListeners();
    loadReport();
}

/**
 * Sets the default month to current month.
 */
function setDefaultMonth() {
    const now = new Date();
    document.getElementById('month-select').value = now.getMonth() + 1;
    document.getElementById('year-select').value = now.getFullYear();
}

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
    document.getElementById('load-report-btn').addEventListener('click', loadReport);
    document.getElementById('download-excel-btn').addEventListener('click', downloadExcel);

    // Also load on month/year change
    document.getElementById('month-select').addEventListener('change', loadReport);
    document.getElementById('year-select').addEventListener('change', loadReport);
}

/**
 * Loads the report for the selected month.
 */
function loadReport() {
    const month = parseInt(document.getElementById('month-select').value);
    const year = parseInt(document.getElementById('year-select').value);

    const orders = getOrdersForMonth(month, year);

    updateSummaryStats(orders);
    renderSupplierBreakdown(orders);
    renderOrdersTimeline(orders);
    renderOrdersTable(orders);
}

/**
 * Gets orders for a specific month.
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Array} Orders for the month
 */
function getOrdersForMonth(month, year) {
    const orders = getOrders();

    return orders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() + 1 === month && orderDate.getFullYear() === year;
    });
}

/**
 * Updates the summary statistics.
 * @param {Array} orders
 */
function updateSummaryStats(orders) {
    const totalExpenses = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalExpenses / totalOrders : 0;

    // Get unique suppliers
    const uniqueSuppliers = new Set(orders.map(o => o.supplierId));
    const activeSuppliers = uniqueSuppliers.size;

    document.getElementById('total-expenses').textContent = `₪${totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('avg-order').textContent = `₪${avgOrder.toFixed(2)}`;
    document.getElementById('active-suppliers').textContent = activeSuppliers;
}

/**
 * Renders the supplier breakdown.
 * @param {Array} orders
 */
function renderSupplierBreakdown(orders) {
    const container = document.getElementById('supplier-breakdown');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <i class="fas fa-chart-pie text-3xl text-slate-300 mb-3 block"></i>
                <p class="text-slate-400">אין נתונים לחודש זה</p>
            </div>
        `;
        return;
    }

    // Group by supplier
    const supplierTotals = {};
    orders.forEach(order => {
        const key = order.supplierId || 'unknown';
        if (!supplierTotals[key]) {
            supplierTotals[key] = {
                name: order.supplierName || 'ספק לא ידוע',
                total: 0,
                count: 0
            };
        }
        supplierTotals[key].total += order.total || 0;
        supplierTotals[key].count++;
    });

    // Sort by total (descending)
    const sorted = Object.values(supplierTotals).sort((a, b) => b.total - a.total);
    const grandTotal = sorted.reduce((sum, s) => sum + s.total, 0);

    // Colors for bars
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    container.innerHTML = sorted.map((supplier, index) => {
        const percentage = grandTotal > 0 ? (supplier.total / grandTotal * 100) : 0;
        const color = colors[index % colors.length];

        return `
            <div class="bg-slate-50 rounded-xl p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold">${escapeHtml(supplier.name)}</span>
                    <span class="text-sm text-slate-500">${supplier.count} הזמנות</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-3 mb-2">
                    <div class="${color} h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500">${percentage.toFixed(1)}%</span>
                    <span class="font-bold">₪${supplier.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renders the orders timeline.
 * @param {Array} orders
 */
function renderOrdersTimeline(orders) {
    const container = document.getElementById('orders-timeline');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <i class="fas fa-calendar text-3xl text-slate-300 mb-3 block"></i>
                <p class="text-slate-400">אין הזמנות לחודש זה</p>
            </div>
        `;
        return;
    }

    // Sort by date
    const sorted = [...orders].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));

    container.innerHTML = sorted.map(order => `
        <div class="flex gap-4 items-start p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
            <div class="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0">
                <i class="fas fa-shopping-basket"></i>
            </div>
            <div class="flex-grow min-w-0">
                <div class="flex justify-between items-start gap-2">
                    <div class="truncate">
                        <span class="font-bold">${order.orderNumber}</span>
                        <span class="text-slate-500"> - ${escapeHtml(order.supplierName || 'ספק לא ידוע')}</span>
                    </div>
                    <span class="font-bold text-emerald-600 shrink-0">₪${(order.total || 0).toFixed(2)}</span>
                </div>
                <p class="text-sm text-slate-500">${formatDateHebrew(order.orderDate)}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Renders the orders table.
 * @param {Array} orders
 */
function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    const noOrdersMsg = document.getElementById('no-orders-message');

    if (orders.length === 0) {
        tbody.innerHTML = '';
        noOrdersMsg.classList.remove('hidden');
        return;
    }

    noOrdersMsg.classList.add('hidden');

    // Sort by date (newest first)
    const sorted = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    tbody.innerHTML = sorted.map(order => `
        <tr class="hover:bg-slate-50">
            <td class="py-4 font-medium">${order.orderNumber || '-'}</td>
            <td class="py-4">${escapeHtml(order.supplierName || '-')}</td>
            <td class="py-4 text-slate-500">${formatDateHebrew(order.orderDate)}</td>
            <td class="py-4">${order.items ? order.items.length : 0} פריטים</td>
            <td class="py-4">${getStatusBadge(order.status)}</td>
            <td class="py-4 text-left font-bold">₪${(order.total || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

/**
 * Gets status badge HTML.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadge(status) {
    const badges = {
        draft: '<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">טיוטה</span>',
        sent: '<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">נשלח</span>',
        delivered: '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">סופק</span>',
        cancelled: '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">בוטל</span>'
    };
    return badges[status] || badges.draft;
}

/**
 * Downloads the report as Excel using SheetJS.
 */
function downloadExcel() {
    const month = parseInt(document.getElementById('month-select').value);
    const year = parseInt(document.getElementById('year-select').value);
    const orders = getOrdersForMonth(month, year);

    if (orders.length === 0) {
        alert('אין נתונים להורדה לחודש זה');
        return;
    }

    // Use the exportMonthlyReport function from export.js
    const success = exportMonthlyReport(orders, month, year);
    if (success) {
        showToast('קובץ Excel הורד בהצלחה');
    }
}

/**
 * Gets status text in Hebrew.
 * @param {string} status
 * @returns {string}
 */
function getStatusText(status) {
    const texts = {
        draft: 'טיוטה',
        sent: 'נשלח',
        delivered: 'סופק',
        cancelled: 'בוטל'
    };
    return texts[status] || 'טיוטה';
}

/**
 * Formats date to Hebrew format.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateHebrew(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Escapes HTML.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Shows a toast notification.
 * @param {string} message
 */
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50';
    toast.textContent = message;
    toast.style.animation = 'fadeInUp 0.3s ease-out';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation keyframes
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeOutDown {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, 20px); }
        }
    `;
    document.head.appendChild(style);
}
