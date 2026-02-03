document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');

    // Initialize UI components
    setupNavigation();

    // If we are on the dashboard page, render it
    if (document.getElementById('stat-orders-month')) {
        renderDashboard();
    }
});

/**
 * Renders the dashboard stats and recent orders.
 */
function renderDashboard() {
    const orders = getOrders();
    const suppliers = getSuppliers();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Stats Calculation
    const ordersThisMonth = orders.filter(o => {
        const d = new Date(o.orderDate);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpenses = ordersThisMonth.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'sent').length;

    // 2. Update UI Stats
    document.getElementById('stat-orders-month').textContent = ordersThisMonth.length;
    document.getElementById('stat-active-suppliers').textContent = suppliers.length;
    document.getElementById('stat-pending-orders').textContent = pendingOrders;
    document.getElementById('stat-total-expenses').textContent = `₪${totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 0 })}`;

    // 3. Render Recent Orders (last 5)
    const recentOrdersList = document.getElementById('recent-orders-list');
    const emptyState = document.getElementById('empty-dashboard-state');

    if (orders.length === 0) {
        recentOrdersList.closest('table').classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    recentOrdersList.closest('table').classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Sort by date newest first
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);

    recentOrdersList.innerHTML = sortedOrders.map(order => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-4 font-mono text-sm">${order.orderNumber}</td>
            <td class="py-4 font-semibold">${escapeHtml(order.supplierName)}</td>
            <td class="py-4 text-slate-500 text-sm">${formatDateHebrew(order.orderDate)}</td>
            <td class="py-4">${getStatusBadgeHtml(order.status)}</td>
            <td class="py-4 text-left font-bold text-slate-900">₪${(order.total || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
        </tr>
    `).join('');
}

/**
 * Handles dashboard navigation and view switching.
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('[data-nav]');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-nav');
            console.log(`Navigating to: ${targetView}`);
            // For now, these are static links, but we can add logic here if needed
        });
    });
}
