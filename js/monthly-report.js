import { getOrders } from './storage.js';
import { showToast, escapeHtml, formatDateHebrew, getStatusBadgeHtml } from './utils.js';
import { exportMonthlyReport } from './export.js';
import './theme.js';
import './sync.js';

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
let reportMode = 'monthly'; // 'monthly' | 'annual'

document.addEventListener('DOMContentLoaded', () => {
    initMonthlyReportPage();
    document.getElementById('print-btn')?.addEventListener('click', () => window.print());
});

function initMonthlyReportPage() {
    const now = new Date();
    document.getElementById('month-select').value = now.getMonth() + 1;
    document.getElementById('year-select').value  = now.getFullYear();

    document.getElementById('download-excel-btn').addEventListener('click', downloadExcel);
    document.getElementById('month-select').addEventListener('change', resetAndSearch);
    document.getElementById('year-select').addEventListener('change',  resetAndSearch);

    let debounceTimer;
    document.getElementById('report-supplier-search').addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applySearch, 350);
    });

    showPrompt();
}

function resetAndSearch() {
    const searchEl = document.getElementById('report-supplier-search');
    if (searchEl?.value) {
        applySearch();
    } else {
        showPrompt();
    }
}

function showPrompt() {
    document.getElementById('report-search-prompt')?.classList.remove('hidden');
    document.getElementById('report-stats-section')?.classList.add('hidden');
    document.getElementById('supplier-breakdown-section')?.classList.add('hidden');
    document.getElementById('orders-detail-section')?.classList.add('hidden');
    document.getElementById('clear-supplier-search')?.classList.add('hidden');
}

function applySearch() {
    const q = (document.getElementById('report-supplier-search')?.value || '').trim().toLowerCase();
    if (!q) { showPrompt(); return; }

    const allOrders = getOrdersForPeriod();
    const orders = allOrders.filter(o => (o.supplierName || '').toLowerCase().includes(q));

    document.getElementById('report-search-prompt')?.classList.add('hidden');
    document.getElementById('clear-supplier-search')?.classList.remove('hidden');

    if (orders.length === 0) {
        document.getElementById('report-stats-section')?.classList.add('hidden');
        document.getElementById('supplier-breakdown-section')?.classList.add('hidden');
        document.getElementById('orders-detail-section')?.classList.add('hidden');
        document.getElementById('supplier-breakdown').innerHTML = `
            <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <i class="fas fa-user-slash text-3xl text-slate-300 mb-3 block"></i>
                <p class="text-slate-400">לא נמצא ספק תואם לפרק הזמן הנבחר</p>
            </div>`;
        document.getElementById('supplier-breakdown-section')?.classList.remove('hidden');
        return;
    }

    updateSummaryStats(orders);
    renderSupplierBreakdown(orders);
    renderOrdersTable(orders);

    document.getElementById('report-stats-section')?.classList.remove('hidden');
    document.getElementById('supplier-breakdown-section')?.classList.remove('hidden');
    document.getElementById('orders-detail-section')?.classList.remove('hidden');
}

function getOrdersForPeriod() {
    const year  = parseInt(document.getElementById('year-select').value);
    const month = parseInt(document.getElementById('month-select').value);
    return getOrders().filter(order => {
        const dateStr = order.deliveryDate || order.orderDate;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d.getFullYear() !== year) return false;
        if (reportMode === 'annual') return true;
        return d.getMonth() + 1 === month;
    });
}

function updateSummaryStats(orders) {
    const billable      = orders.filter(o => o.status !== 'not_delivered');
    const totalExpenses = billable.reduce((s, o) => s + (o.actualTotal != null ? o.actualTotal : (o.total || 0)), 0);
    const activeSuppliers = new Set(orders.map(o => o.supplierId)).size;

    document.getElementById('total-expenses').textContent  = `₪${totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-orders').textContent    = orders.length;
    document.getElementById('active-suppliers').textContent = activeSuppliers;
}

function renderSupplierBreakdown(orders) {
    const container = document.getElementById('supplier-breakdown');
    const supplierTotals = {};

    orders.forEach(order => {
        const key = order.supplierId || 'unknown';
        if (!supplierTotals[key]) {
            supplierTotals[key] = { name: order.supplierName || 'ספק לא ידוע', total: 0, count: 0, products: {}, orders: [] };
        }
        supplierTotals[key].orders.push(order);
        if (order.status === 'not_delivered') return;

        const orderTotal = order.actualTotal != null ? order.actualTotal : (order.total || 0);
        supplierTotals[key].total += orderTotal;
        supplierTotals[key].count++;

        (order.items || []).forEach(item => {
            const prodKey = item.productId || item.name;
            if (!supplierTotals[key].products[prodKey]) {
                supplierTotals[key].products[prodKey] = { name: item.name, quantity: 0, unit: item.unit || 'יח׳', total: 0 };
            }
            const qty   = item.receivedQty != null ? item.receivedQty : (item.quantity || 0);
            const total = item.actualTotal != null ? item.actualTotal : (item.total || (item.price * item.quantity) || 0);
            supplierTotals[key].products[prodKey].quantity += qty;
            supplierTotals[key].products[prodKey].total    += total;
        });
    });

    const sorted = Object.values(supplierTotals).sort((a, b) => b.total - a.total);
    const grandTotal = sorted.reduce((s, sup) => s + sup.total, 0);
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    container.innerHTML = sorted.map((supplier, index) => {
        const pct   = grandTotal > 0 ? (supplier.total / grandTotal * 100) : 0;
        const color = colors[index % colors.length];
        const cid   = `supplier-content-${index}`;
        const avg   = supplier.count > 0 ? supplier.total / supplier.count : 0;

        const productsHtml = Object.values(supplier.products)
            .sort((a, b) => b.total - a.total)
            .map(p => `
            <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm">
                <div>
                    <span class="font-medium text-slate-700">${escapeHtml(p.name)}</span>
                    <span class="text-slate-400 text-xs mr-2">${p.quantity} ${p.unit}</span>
                </div>
                <span class="font-bold text-slate-700">₪${p.total.toFixed(2)}</span>
            </div>`).join('') || '<div class="text-sm text-slate-400 py-2">אין פירוט מוצרים</div>';

        const ordersHtml = [...supplier.orders]
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map(o => {
                const oTotal = o.actualTotal != null ? o.actualTotal : (o.total || 0);
                const isND   = o.status === 'not_delivered';
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

        return `
        <div class="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 mb-3">
            <div class="p-4 cursor-pointer hover:bg-slate-100 transition-colors flex flex-col gap-2" onclick="toggleAccordion('${cid}')">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-chevron-down text-slate-400 transition-transform duration-300" id="icon-${cid}"></i>
                        <span class="font-semibold text-slate-800">${escapeHtml(supplier.name)}</span>
                    </div>
                    <span class="text-sm text-slate-500">${supplier.count} הזמנות | ממוצע: ₪${avg.toFixed(0)}</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2">
                    <div class="${color} h-2 rounded-full transition-all duration-500" style="width:${pct}%"></div>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-slate-500">${pct.toFixed(1)}%</span>
                    <span class="font-bold text-slate-800">₪${supplier.total.toFixed(2)}</span>
                </div>
            </div>
            <div id="${cid}" class="hidden bg-white border-t border-slate-100">
                <div class="flex border-b border-slate-100">
                    <button onclick="showSupplierTab('${cid}','products')"
                        class="flex-1 py-2 text-xs font-bold text-emerald-600 border-b-2 border-emerald-500">מוצרים</button>
                    <button onclick="showSupplierTab('${cid}','orders')"
                        class="flex-1 py-2 text-xs font-bold text-slate-400 border-b-2 border-transparent">הזמנות</button>
                </div>
                <div id="${cid}-products" class="px-4 py-2">${productsHtml}</div>
                <div id="${cid}-orders" class="hidden px-4 py-2">${ordersHtml}</div>
            </div>
        </div>`;
    }).join('');

    window.toggleAccordion = function(cid) {
        const el   = document.getElementById(cid);
        const icon = document.getElementById('icon-' + cid);
        const open = el.classList.toggle('hidden');
        icon.style.transform = open ? '' : 'rotate(180deg)';
    };

    window.showSupplierTab = function(cid, tab) {
        document.getElementById(cid + '-products').classList.toggle('hidden', tab !== 'products');
        document.getElementById(cid + '-orders').classList.toggle('hidden',   tab !== 'orders');
        document.querySelectorAll(`#${cid} > div > button`).forEach(btn => {
            const isActive = btn.getAttribute('onclick').includes(`'${tab}'`);
            btn.classList.toggle('text-emerald-600', isActive);
            btn.classList.toggle('border-emerald-500', isActive);
            btn.classList.toggle('text-slate-400', !isActive);
            btn.classList.toggle('border-transparent', !isActive);
        });
    };
}

function renderOrdersTable(orders) {
    const tbody      = document.getElementById('orders-table-body');
    const noOrderMsg = document.getElementById('no-orders-message');

    if (orders.length === 0) {
        tbody.innerHTML = '';
        noOrderMsg?.classList.remove('hidden');
        return;
    }
    noOrderMsg?.classList.add('hidden');

    const sorted = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    tbody.innerHTML = sorted.map(order => {
        const isND  = order.status === 'not_delivered';
        const total = order.actualTotal != null ? order.actualTotal : (order.total || 0);
        return `
        <tr class="hover:bg-slate-50${isND ? ' opacity-50' : ''}">
            <td class="py-4 font-medium">${order.orderNumber || '-'}</td>
            <td class="py-4">${escapeHtml(order.supplierName || '-')}</td>
            <td class="py-4 text-slate-500">${formatDateHebrew(order.orderDate)}</td>
            <td class="py-4">${(order.items || []).length} פריטים</td>
            <td class="py-4">${getStatusBadgeHtml(order.status)}</td>
            <td class="py-4 text-left font-bold ${isND ? 'line-through text-slate-400' : ''}">₪${total.toFixed(2)}</td>
        </tr>`;
    }).join('');
}

function downloadExcel() {
    const month  = parseInt(document.getElementById('month-select').value);
    const year   = parseInt(document.getElementById('year-select').value);
    const orders = getOrdersForPeriod();
    if (orders.length === 0) { alert('אין נתונים להורדה לתקופה זו'); return; }
    const success = exportMonthlyReport(orders, month, year);
    if (success) showToast('קובץ Excel הורד בהצלחה');
}

Object.assign(window, {
    setReportMode(mode) {
        reportMode = mode;
        const monthSel = document.getElementById('month-select');
        monthSel.disabled = (mode === 'annual');
        monthSel.classList.toggle('opacity-40', mode === 'annual');
        document.getElementById('mode-monthly').className =
            `px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`;
        document.getElementById('mode-annual').className =
            `px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'annual'  ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`;
        resetAndSearch();
    },
    clearReportSearch() {
        const el = document.getElementById('report-supplier-search');
        if (el) el.value = '';
        showPrompt();
    }
});
