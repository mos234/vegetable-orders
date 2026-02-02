/**
 * Vegetable Orders Management - Storage Layer
 * Handles data persistence using LocalStorage.
 */

const STORAGE_KEYS = {
    SUPPLIERS: 'vegetable_suppliers',
    ORDERS: 'vegetable_orders'
};

/**
 * Initializes the storage with empty arrays if not present.
 */
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    console.log('Storage initialized');
}

/**
 * Gets data from localStorage by key.
 * @param {string} key 
 * @returns {Array}
 */
function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

/**
 * Saves data to localStorage by key.
 * @param {string} key 
 * @param {Array} data 
 */
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ==================== SUPPLIER FUNCTIONS ====================

/**
 * Gets all suppliers from storage.
 * @returns {Array} Array of supplier objects
 */
function getSuppliers() {
    return getData(STORAGE_KEYS.SUPPLIERS);
}

/**
 * Saves a new supplier to storage.
 * @param {Object} supplier - The supplier object { name, phone, notes }
 * @returns {Object} The saved supplier with generated ID
 */
function saveSupplier(supplier) {
    const suppliers = getSuppliers();
    const newSupplier = {
        id: Date.now().toString(),
        name: supplier.name,
        phone: supplier.phone,
        notes: supplier.notes || '',
        createdAt: new Date().toISOString()
    };
    suppliers.push(newSupplier);
    saveData(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSupplier;
}

/**
 * Updates an existing supplier.
 * @param {string} id - The supplier ID
 * @param {Object} updatedData - The updated supplier data
 * @returns {Object|null} The updated supplier or null if not found
 */
function updateSupplier(id, updatedData) {
    const suppliers = getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;

    suppliers[index] = {
        ...suppliers[index],
        name: updatedData.name,
        phone: updatedData.phone,
        notes: updatedData.notes || '',
        updatedAt: new Date().toISOString()
    };
    saveData(STORAGE_KEYS.SUPPLIERS, suppliers);
    return suppliers[index];
}

/**
 * Deletes a supplier by ID.
 * @param {string} id - The supplier ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteSupplier(id) {
    const suppliers = getSuppliers();
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) return false;
    saveData(STORAGE_KEYS.SUPPLIERS, filtered);
    return true;
}

/**
 * Gets a single supplier by ID.
 * @param {string} id - The supplier ID
 * @returns {Object|null} The supplier or null if not found
 */
function getSupplierById(id) {
    const suppliers = getSuppliers();
    return suppliers.find(s => s.id === id) || null;
}

// ==================== ORDER FUNCTIONS ====================

/**
 * Gets all orders from storage.
 * @returns {Array} Array of order objects
 */
function getOrders() {
    return getData(STORAGE_KEYS.ORDERS);
}

/**
 * Saves a new order to storage.
 * @param {Object} order - The order object
 * @returns {Object} The saved order with generated ID
 */
function saveOrder(order) {
    const orders = getOrders();
    const orderNumber = generateOrderNumber();
    const newOrder = {
        id: Date.now().toString(),
        orderNumber: orderNumber,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        supplierPhone: order.supplierPhone,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        items: order.items || [],
        notes: order.notes || '',
        total: order.total || 0,
        status: order.status || 'draft', // draft, sent, delivered, cancelled
        createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    saveData(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
}

/**
 * Updates an existing order.
 * @param {string} id - The order ID
 * @param {Object} updatedData - The updated order data
 * @returns {Object|null} The updated order or null if not found
 */
function updateOrder(id, updatedData) {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index] = {
        ...orders[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
    };
    saveData(STORAGE_KEYS.ORDERS, orders);
    return orders[index];
}

/**
 * Deletes an order by ID.
 * @param {string} id - The order ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteOrder(id) {
    const orders = getOrders();
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    saveData(STORAGE_KEYS.ORDERS, filtered);
    return true;
}

/**
 * Gets a single order by ID.
 * @param {string} id - The order ID
 * @returns {Object|null} The order or null if not found
 */
function getOrderById(id) {
    const orders = getOrders();
    return orders.find(o => o.id === id) || null;
}

/**
 * Generates a unique order number.
 * @returns {string} Order number in format #XXXX
 */
function generateOrderNumber() {
    const orders = getOrders();
    const lastOrder = orders[orders.length - 1];
    let nextNumber = 1001;

    if (lastOrder && lastOrder.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber.replace('#', ''));
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `#${nextNumber}`;
}

/**
 * Gets orders filtered by status.
 * @param {string} status - The status to filter by
 * @returns {Array} Filtered orders
 */
function getOrdersByStatus(status) {
    const orders = getOrders();
    return orders.filter(o => o.status === status);
}

/**
 * Gets orders for a specific supplier.
 * @param {string} supplierId - The supplier ID
 * @returns {Array} Orders for the supplier
 */
function getOrdersBySupplierId(supplierId) {
    const orders = getOrders();
    return orders.filter(o => o.supplierId === supplierId);
}

// ==================== BACKUP & RESTORE FUNCTIONS ====================

/**
 * Exports all application data to a JSON file.
 * Creates a downloadable backup file with suppliers and orders.
 */
function exportAllData() {
    try {
        const suppliers = getSuppliers();
        const orders = getOrders();

        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            appName: 'Vegetable Orders Management',
            data: {
                suppliers: suppliers,
                orders: orders
            },
            stats: {
                suppliersCount: suppliers.length,
                ordersCount: orders.length
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Generate filename with date
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;

        link.href = url;
        link.download = `vegetable_orders_backup_${dateStr}_${timeStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show success message
        showBackupToast(`גיבוי הושלם בהצלחה! (${suppliers.length} ספקים, ${orders.length} הזמנות)`);

        console.log('Data exported successfully:', backupData.stats);
        return true;
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('שגיאה בייצוא הנתונים');
        return false;
    }
}

/**
 * Imports data from a JSON backup file.
 * @param {Event} event - The file input change event
 */
function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Verify file type
    if (!file.name.endsWith('.json')) {
        alert('נא לבחור קובץ JSON בלבד');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // Validate backup structure
            if (!backupData.data || !backupData.data.suppliers || !backupData.data.orders) {
                alert('קובץ הגיבוי אינו תקין או פגום');
                event.target.value = '';
                return;
            }

            // Get current counts
            const currentSuppliers = getSuppliers().length;
            const currentOrders = getOrders().length;
            const newSuppliers = backupData.data.suppliers.length;
            const newOrders = backupData.data.orders.length;

            // Confirmation dialog
            const confirmMessage = `פעולה זו תחליף את כל הנתונים הקיימים!\n\n` +
                `נתונים נוכחיים:\n` +
                `• ${currentSuppliers} ספקים\n` +
                `• ${currentOrders} הזמנות\n\n` +
                `נתונים מהגיבוי:\n` +
                `• ${newSuppliers} ספקים\n` +
                `• ${newOrders} הזמנות\n\n` +
                `תאריך גיבוי: ${backupData.exportDate ? new Date(backupData.exportDate).toLocaleString('he-IL') : 'לא ידוע'}\n\n` +
                `האם להמשיך?`;

            if (!confirm(confirmMessage)) {
                event.target.value = '';
                return;
            }

            // Import the data
            saveData(STORAGE_KEYS.SUPPLIERS, backupData.data.suppliers);
            saveData(STORAGE_KEYS.ORDERS, backupData.data.orders);

            // Show success message
            showBackupToast(`שחזור הושלם בהצלחה! (${newSuppliers} ספקים, ${newOrders} הזמנות)`);

            console.log('Data imported successfully:', {
                suppliers: newSuppliers,
                orders: newOrders
            });

            // Reload page to reflect changes
            setTimeout(() => {
                location.reload();
            }, 1500);

        } catch (error) {
            console.error('Error importing data:', error);
            alert('שגיאה בקריאת קובץ הגיבוי. נא לוודא שהקובץ תקין.');
        }

        event.target.value = '';
    };

    reader.onerror = function() {
        alert('שגיאה בקריאת הקובץ');
        event.target.value = '';
    };

    reader.readAsText(file);
}

/**
 * Shows a toast notification for backup operations.
 * @param {string} message - The message to display
 */
function showBackupToast(message) {
    // Remove existing toast if any
    const existing = document.querySelector('.backup-toast');
    if (existing) existing.remove();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'backup-toast fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3';
    toast.innerHTML = `
        <i class="fas fa-check-circle text-emerald-400"></i>
        <span>${message}</span>
    `;

    // Add animation
    toast.style.animation = 'fadeInUp 0.3s ease-out';

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add animation keyframes if not already present
if (typeof document !== 'undefined' && !document.getElementById('backup-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'backup-toast-styles';
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

// Initialize on load
initStorage();
