/**
 * Vegetable Orders Management - Monthly Report Page Logic
 * Handles displaying monthly expense reports.
 */

import { getOrders } from './storage.js';
import { showToast, escapeHtml, formatDateHebrew, getStatusBadgeHtml } from './utils.js';
import { exportMonthlyReport } from './export.js';
import './theme.js';
import './sync.js';

document.addEventListener('DOMContentLoaded', () => {
    initMonthlyReportPage();
    document.getElementById('print-btn')?.addEventListener('click', () => window.print());
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
    document.getElementById('download-excel-btn').addEventListener('click', downloadExcel);
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

    updateSummaryStats(orders, month, year);
    renderSupplierBreakdown(orders);
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
        const dateStr = order.deliveryDate || order.orderDate;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
}

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

/**
 * Updates the summary statistics.
 * @param {Array} orders
 * @param {number} month
 * @param {number} year
 */
function updateSummaryStats(orders, month, year) {
    const billableOrders = orders.filter(o => o.status !== 'not_delivered');
    const totalExpenses = billableOrders.reduce((sum, o) => sum + (o.actualTotal != null ? o.actualTotal : (o.total || 0)), 0);
    const totalOrders = orders.length;

    // Get unique suppliers
    const uniqueSuppliers = new Set(orders.map(o => o.supplierId));
    const activeSuppliers = uniqueSuppliers.size;

    document.getElementById('total-expenses').textContent = `₪${totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('active-suppliers').textContent = activeSuppliers;

    // Update page subtitle with month/year
    const subtitle = document.querySelector('header p.text-slate-500');
    if (subtitle && month && year) {
        subtitle.textContent = `${MONTH_NAMES[month - 1]} ${year} — סה"כ: ₪${totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
    }
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

    // Group by supplier and accumulate products + orders
    const supplierTotals = {};
    orders.forEach(order => {
        const key = order.supplierId || 'unknown';
        if (!supplierTotals[key]) {
            supplierTotals[key] = {
                name: order.supplierName || 'ספק לא ידוע',
                total: 0,
                count: 0,
                products: {},
                orders: []
            };
        }
        supplierTotals[key].orders.push(order);

        // not_delivered לא נחשב בסכומים
        if (order.status === 'not_delivered') return;

        const orderTotal = order.actualTotal != null ? order.actualTotal : (order.total || 0);
        supplierTotals[key].total += orderTotal;
        supplierTotals[key].count++;

        // Process items within the order
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const prodKey = item.productId || item.id || item.name;
                if (!supplierTotals[key].products[prodKey]) {
                    supplierTotals[key].products[prodKey] = {
                        name: item.name,
                        quantity: 0,
                        unit: item.unit || 'יח׳',
                        total: 0
                    };
                }
                const itemQty = item.receivedQty != null ? item.receivedQty : (item.quantity || 0);
                const itemTotal = item.actualTotal != null ? item.actualTotal : (item.total || (item.price * item.quantity) || 0);
                supplierTotals[key].products[prodKey].quantity += itemQty;
                supplierTotals[key].products[prodKey].total += itemTotal;
            });
        }
    });

    // Sort by total (descending)
    const sorted = Object.values(supplierTotals).sort((a, b) => b.total - a.total);
    const grandTotal = sorted.reduce((sum, s) => sum + s.total, 0);

    // Colors for bars
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    container.innerHTML = sorted.map((supplier, index) => {
        const percentage = grandTotal > 0 ? (supplier.total / grandTotal * 100) : 0;
        const color = colors[index % colors.length];

        // Generate products list HTML
        const productsSorted = Object.values(supplier.products).sort((a, b) => b.total - a.total);
        const productsHtml = productsSorted.length > 0 ? productsSorted.map(prod => `
            <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm">
                <div>
                    <span class="font-medium text-slate-700">${escapeHtml(prod.name)}</span>
                    <span class="text-slate-400 text-xs mr-2">${prod.quantity} ${prod.unit}</span>
                </div>
                <span class="font-bold text-slate-700">₪${prod.total.toFixed(2)}</span>
            </div>
        `).join('') : '<div class="text-sm text-slate-400 py-2">אין פירוט מוצרים</div>';

        // Generate orders list HTML
        const ordersSorted = [...supplier.orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        const ordersHtml = ordersSorted.map(o => {
            const oTotal = o.actualTotal != null ? o.actualTotal : (o.total || 0);
            const isND = o.status === 'not_delivered';
            return `
            <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm ${isND ? 'opacity-50' : ''}">
                <div>
                    <span class="font-medium text-slate-700">${escapeHtml(o.orderNumber || '-')}</span>
                    <span class="text-slate-400 text-xs mr-2">${formatDateHebrew(o.orderDate)}</span>
                    ${getStatusBadgeHtml(o.status)}
                </div>
                <span class="${isND ? 'line-through text-slate-400' : 'font-bold text-emerald-700'}">₪${oTotal.toFixed(2)}</span>
            </div>`;
        }).join('');

        const avgPerOrder = supplier.count > 0 ? (supplier.total / supplier.count) : 0;

        // Unique ID for the accordion content
        const contentId = `supplier-content-${index}`;

        return `
            <div class="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 mb-3">
                <!-- Header (Clickable) -->
                <div class="p-4 cursor-pointer hover:bg-slate-100 transition-colors flex flex-col gap-2" onclick="toggleAccordion('${contentId}')">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-chevron-down text-slate-400 transition-transform duration-300" id="icon-${contentId}"></i>
                            <span class="font-semibold text-slate-800">${escapeHtml(supplier.name)}</span>
                        </div>
                        <span class="text-sm text-slate-500">${supplier.count} הזמנות | ממוצע: ₪${avgPerOrder.toFixed(0)}</span>
                    </div>

                    <!-- Progress bar -->
                    <div class="w-full bg-slate-200 rounded-full h-2">
                        <div class="${color} h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>

                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">${percentage.toFixed(1)}%</span>
                        <span class="font-bold text-slate-800">₪${supplier.total.toFixed(2)}</span>
                    </div>
                </div>

                <!-- Expanded Content -->
                <div id="${contentId}" class="hidden bg-white border-t border-slate-100">
                    <!-- Tabs -->
                    <div class="flex border-b border-slate-100">
                        <button onclick="showSupplierTab('${contentId}','products')" id="tab-products-${index}"
                            class="flex-1 py-2 text-xs font-bold text-emerald-600 border-b-2 border-emerald-500">מוצרים</button>
                        <button onclick="showSupplierTab('${contentId}','orders')" id="tab-orders-${index}"
                            class="flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent">הזמנות</button>
                    </div>
                    <div id="${contentId}-products" class="px-4 py-2">
                        <h4 class="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">פירוט מוצרים:</h4>
                        ${productsHtml}
                    </div>
                    <div id="${contentId}-orders" class="hidden px-4 py-2">
                        <h4 class="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">פירוט הזמנות:</h4>
                        ${ordersHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (!window.toggleAccordion) {
        window.toggleAccordion = function(contentId) {
            const content = document.getElementById(contentId);
            const icon = document.getElementById('icon-' + contentId);
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        };
    }

    if (!window.showSupplierTab) {
        window.showSupplierTab = function(contentId, tab) {
            const productsPanel = document.getElementById(contentId + '-products');
            const ordersPanel   = document.getElementById(contentId + '-orders');
            // find tab buttons by their onclick attribute content
            const allBtns = document.querySelectorAll(`#${contentId} button[onclick^="showSupplierTab"]`);
            allBtns.forEach(b => {
                b.classList.remove('text-emerald-600', 'border-emerald-500');
                b.classList.add('text-slate-400', 'border-transparent');
            });
            const activeBtn = [...allBtns].find(b => b.getAttribute('onclick').includes(`'${tab}'`));
            if (activeBtn) {
                activeBtn.classList.remove('text-slate-400', 'border-transparent');
                activeBtn.classList.add('text-emerald-600', 'border-emerald-500');
            }
            if (tab === 'products') {
                productsPanel.classList.remove('hidden');
                ordersPanel.classList.add('hidden');
            } else {
                productsPanel.classList.add('hidden');
                ordersPanel.classList.remove('hidden');
            }
        };
    }
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

    tbody.innerHTML = sorted.map(order => {
        const isND = order.status === 'not_delivered';
        return `
        <tr class="hover:bg-slate-50${isND ? ' opacity-50' : ''}">
            <td class="py-4 font-medium">${order.orderNumber || '-'}</td>
            <td class="py-4">${escapeHtml(order.supplierName || '-')}</td>
            <td class="py-4 text-slate-500">${formatDateHebrew(order.orderDate)}</td>
            <td class="py-4">${order.items ? order.items.length : 0} פריטים</td>
            <td class="py-4">${getStatusBadgeHtml(order.status)}</td>
            <td class="py-4 text-left font-bold ${isND ? 'line-through text-slate-400' : ''}">₪${(order.total || 0).toFixed(2)}</td>
        </tr>`;
    }).join('');
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
