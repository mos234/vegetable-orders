// ===== Splash Screen =====
(function initSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // Show only once per session
    if (sessionStorage.getItem('splash-shown')) {
        splash.remove();
        return;
    }

    setTimeout(() => {
        splash.classList.add('splash-hidden');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
        sessionStorage.setItem('splash-shown', '1');
    }, 1500);
})();

// ===== PWA Install Prompt =====
let _deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    _deferredInstallPrompt = event;

    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('install-btn');
    if (btn) btn.classList.add('hidden');
    _deferredInstallPrompt = null;
});

function triggerInstallPrompt() {
    if (!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(() => {
        _deferredInstallPrompt = null;
        const btn = document.getElementById('install-btn');
        if (btn) btn.classList.add('hidden');
    });
}

// ===== Background Sync — handle pending orders pushed from SW =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_PENDING_ORDER') {
            const order = event.data.order;
            // Order is already in localStorage (saved before queuing) — just notify user
            if (typeof showToast === 'function') {
                showToast(`הרשת חזרה — הזמנה לספק ${order.supplierName} ממתינה לשליחה`, 'info');
            }
            console.log('[App] Pending order ready to send:', order.id);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');

    // Wire up install button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', triggerInstallPrompt);
    }

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

    // 3. Returns stats
    if (typeof getReturns === 'function') {
        const returns = getReturns();
        const returnsThisMonth = returns.filter(r => {
            const d = new Date(r.returnDate || r.createdAt);
            return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });
        const pendingReturns = returns.filter(r => r.status === 'pending').length;
        const creditThisMonth = returnsThisMonth.reduce((sum, r) => sum + (r.total || 0), 0);

        const pendingEl = document.getElementById('dash-pending-returns');
        const monthEl = document.getElementById('dash-returns-month');
        const creditEl = document.getElementById('dash-returns-credit');
        if (pendingEl) pendingEl.textContent = pendingReturns;
        if (monthEl) monthEl.textContent = returnsThisMonth.length;
        if (creditEl) creditEl.textContent = `₪${creditThisMonth.toLocaleString('he-IL', { minimumFractionDigits: 0 })}`;
    }

    // 4. Render Recent Orders (last 5)
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
