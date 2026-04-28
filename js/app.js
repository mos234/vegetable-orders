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

function renderDashboard() {
    const orders = getOrders();
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Filter orders for today
    const ordersToday = orders.filter(o => o.deliveryDate === todayString || o.orderDate === todayString);

    // 4. Render Today's Orders
    const recentOrdersList = document.getElementById('recent-orders-list');
    const emptyState = document.getElementById('empty-dashboard-state');

    if (ordersToday.length === 0) {
        recentOrdersList.closest('table').classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    recentOrdersList.closest('table').classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Sort by delivery time if available
    const sortedOrders = [...ordersToday].sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''));

    recentOrdersList.innerHTML = sortedOrders.map(order => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-4 font-mono text-sm">${order.orderNumber}</td>
            <td class="py-4 font-semibold">${escapeHtml(order.supplierName)}</td>
            <td class="py-4 text-slate-500 text-sm">${escapeHtml(order.deliveryTime || 'לא צוין')}</td>
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
