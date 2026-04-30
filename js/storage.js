/**
 * Vegetable Orders Management - Storage Layer
 * Handles data persistence using LocalStorage.
 */
import { showToast } from './utils.js';

const STORAGE_KEYS = {
    SUPPLIERS: 'vegetable_suppliers',
    ORDERS: 'vegetable_orders',
    RETURNS: 'vegetable_returns',
    PRICE_CATALOG: 'vegetable_price_catalog',
    SETTINGS: 'vegetable_settings'
};

export function getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : {};
}

export function saveSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * Initializes the storage with empty arrays if not present.
 */
export function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RETURNS)) {
        localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRICE_CATALOG)) {
        localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify({}));
    }
}

/**
 * Gets data from localStorage by key.
 * @param {string} key 
 * @returns {Array}
 */
export function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

/**
 * Saves data to localStorage by key.
 * @param {string} key 
 * @param {Array} data 
 */
export function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ==================== SUPPLIER FUNCTIONS ====================

/**
 * Gets all suppliers from storage.
 * @returns {Array} Array of supplier objects
 */
export function getSuppliers() {
    return getData(STORAGE_KEYS.SUPPLIERS);
}

/**
 * Saves a new supplier to storage.
 * @param {Object} supplier - The supplier object { name, phone, notes }
 * @returns {Object} The saved supplier with generated ID
 */
export function saveSupplier(supplier) {
    const suppliers = getSuppliers();
    const newSupplier = {
        id: Date.now().toString(),
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email || '',
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
export function updateSupplier(id, updatedData) {
    const suppliers = getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;

    suppliers[index] = {
        ...suppliers[index],
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email !== undefined ? updatedData.email : suppliers[index].email,
        notes: updatedData.notes !== undefined ? updatedData.notes : suppliers[index].notes,
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
export function deleteSupplier(id) {
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
export function getSupplierById(id) {
    const suppliers = getSuppliers();
    return suppliers.find(s => s.id === id) || null;
}

// ==================== ORDER FUNCTIONS ====================

/**
 * Gets all orders from storage.
 * @returns {Array} Array of order objects
 */
export function getOrders() {
    return getData(STORAGE_KEYS.ORDERS);
}

/**
 * Saves a new order to storage.
 * @param {Object} order - The order object
 * @returns {Object} The saved order with generated ID
 */
export function saveOrder(order) {
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
        deliveryTime: order.deliveryTime || '',
        mainHallName: order.mainHallName || '',
        items: order.items || [],
        halls: order.halls || [],
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
export function updateOrder(id, updatedData) {
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
export function deleteOrder(id) {
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
export function getOrderById(id) {
    const orders = getOrders();
    return orders.find(o => o.id === id) || null;
}

/**
 * Generates a unique order number.
 * @returns {string} Order number in format #XXXX
 */
export function generateOrderNumber() {
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
export function getOrdersByStatus(status) {
    const orders = getOrders();
    return orders.filter(o => o.status === status);
}

/**
 * Gets orders for a specific supplier.
 * @param {string} supplierId - The supplier ID
 * @returns {Array} Orders for the supplier
 */
export function getOrdersBySupplierId(supplierId) {
    const orders = getOrders();
    return orders.filter(o => o.supplierId === supplierId);
}

// ==================== BACKUP & RESTORE FUNCTIONS ====================

/**
 * Exports all application data to a JSON file.
 * Creates a downloadable backup file with suppliers and orders.
 */
export function exportAllData() {
    try {
        const suppliers = getSuppliers();
        const orders = getOrders();

        const returns = getReturns();
        const catalog = getPriceCatalog();
        const backupData = {
            version: '1.1',
            exportDate: new Date().toISOString(),
            appName: 'Vegetable Orders Management',
            data: {
                suppliers: suppliers,
                orders: orders,
                returns: returns,
                catalog: catalog
            },
            stats: {
                suppliersCount: suppliers.length,
                ordersCount: orders.length,
                returnsCount: returns.length
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

        // Show success message using shared utility
        showToast(`גיבוי הושלם! (${suppliers.length} ספקים, ${orders.length} הזמנות, ${returns.length} החזרות)`);

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
export function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Verify file type
    if (!file.name.endsWith('.json')) {
        alert('נא לבחור קובץ JSON בלבד');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
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
            if (backupData.data.returns) {
                saveData(STORAGE_KEYS.RETURNS, backupData.data.returns);
            }
            if (backupData.data.catalog) {
                localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify(backupData.data.catalog));
            }

            showToast(`שחזור הושלם! (${newSuppliers} ספקים, ${newOrders} הזמנות)`);

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

    reader.onerror = function () {
        alert('שגיאה בקריאת הקובץ');
        event.target.value = '';
    };

    reader.readAsText(file);
}

// ==================== RETURNS FUNCTIONS ====================

export function getReturns() {
    return getData(STORAGE_KEYS.RETURNS);
}

export function saveReturn(returnObj) {
    const returns = getReturns();
    const newReturn = {
        id: Date.now().toString(),
        returnNumber: generateReturnNumber(),
        supplierId: returnObj.supplierId,
        supplierName: returnObj.supplierName,
        supplierPhone: returnObj.supplierPhone,
        orderId: returnObj.orderId || '',
        orderNumber: returnObj.orderNumber || '',
        returnDate: returnObj.returnDate,
        items: returnObj.items || [],
        reason: returnObj.reason || '',
        notes: returnObj.notes || '',
        total: returnObj.total || 0,
        status: returnObj.status || 'pending',
        createdAt: new Date().toISOString()
    };
    returns.push(newReturn);
    saveData(STORAGE_KEYS.RETURNS, returns);
    return newReturn;
}

export function updateReturn(id, updatedData) {
    const returns = getReturns();
    const index = returns.findIndex(r => r.id === id);
    if (index === -1) return null;
    returns[index] = { ...returns[index], ...updatedData, updatedAt: new Date().toISOString() };
    saveData(STORAGE_KEYS.RETURNS, returns);
    return returns[index];
}

export function deleteReturn(id) {
    const returns = getReturns();
    const filtered = returns.filter(r => r.id !== id);
    if (filtered.length === returns.length) return false;
    saveData(STORAGE_KEYS.RETURNS, filtered);
    return true;
}

export function getReturnById(id) {
    return getReturns().find(r => r.id === id) || null;
}

export function getReturnsByStatus(status) {
    return getReturns().filter(r => r.status === status);
}

export function getReturnsBySupplierId(supplierId) {
    return getReturns().filter(r => r.supplierId === supplierId);
}

export function generateReturnNumber() {
    const returns = getReturns();
    const last = returns[returns.length - 1];
    let next = 5001;
    if (last && last.returnNumber) {
        const n = parseInt(last.returnNumber.replace('R#', ''));
        if (!isNaN(n)) next = n + 1;
    }
    return `R#${next}`;
}

// ==================== PRICE CATALOG FUNCTIONS ====================

export function getPriceCatalog() {
    const data = localStorage.getItem(STORAGE_KEYS.PRICE_CATALOG);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        // Migration: old format was object keyed by name
        if (!Array.isArray(parsed)) {
            const arr = Object.entries(parsed).map(([name, entry], i) => ({
                id: 'migrated_' + Date.now() + '_' + i,
                name,
                price: typeof entry === 'object' ? (entry.price || 0) : (entry || 0),
                category: typeof entry === 'object' ? (entry.category || '') : '',
                notes: typeof entry === 'object' ? (entry.notes || '') : '',
                supplierId: '',
                unit: 'kg'
            }));
            localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify(arr));
            return arr;
        }
        return parsed;
    } catch(e) { return []; }
}

export function saveCatalogItem(item) {
    const catalog = getPriceCatalog();
    if (item.id) {
        const idx = catalog.findIndex(c => c.id === item.id);
        if (idx !== -1) {
            catalog[idx] = { ...catalog[idx], ...item };
        } else {
            catalog.push(item);
        }
    } else {
        catalog.push({
            id: 'cat_' + Date.now(),
            name: item.name || '',
            price: item.price || 0,
            category: item.category || '',
            notes: item.notes || '',
            supplierId: item.supplierId || '',
            unit: item.unit || 'kg'
        });
    }
    localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify(catalog));
}

export function deleteCatalogItem(id) {
    const catalog = getPriceCatalog().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify(catalog));
}

export function updatePriceCatalog(items) {
    const catalog = getPriceCatalog();
    items.forEach(item => {
        if (!item.name || !(item.price > 0)) return;
        const existing = catalog.find(c => c.name === item.name &&
            (!item.supplierId || c.supplierId === item.supplierId));
        if (existing) existing.price = item.price;
    });
    localStorage.setItem(STORAGE_KEYS.PRICE_CATALOG, JSON.stringify(catalog));
}

export function getCatalogItemsBySupplier(supplierId) {
    return getPriceCatalog().filter(c => c.supplierId === supplierId);
}

// ==================== WHATSAPP GROUPS FUNCTIONS ====================

/**
 * Gets all WhatsApp groups.
 * @returns {Array} Array of group objects { id, name, link }
 */
export function getGroups() {
    return getData(STORAGE_KEYS.GROUPS || 'vegetable_groups');
}

/**
 * Saves a new WhatsApp group.
 * @param {Object} group - { name, link }
 * @returns {Object} Saved group with generated ID
 */
export function saveGroup(group) {
    const groups = getGroups();
    const newGroup = {
        id: Date.now().toString(),
        name: group.name.trim(),
        link: group.link.trim(),
        createdAt: new Date().toISOString()
    };
    groups.push(newGroup);
    localStorage.setItem('vegetable_groups', JSON.stringify(groups));
    return newGroup;
}

/**
 * Updates an existing group.
 * @param {string} id
 * @param {Object} updatedData - { name, link }
 */
export function updateGroup(id, updatedData) {
    const groups = getGroups();
    const idx = groups.findIndex(g => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], ...updatedData, updatedAt: new Date().toISOString() };
    localStorage.setItem('vegetable_groups', JSON.stringify(groups));
    return groups[idx];
}

/**
 * Deletes a group by ID.
 * @param {string} id
 */
export function deleteGroup(id) {
    const groups = getGroups().filter(g => g.id !== id);
    localStorage.setItem('vegetable_groups', JSON.stringify(groups));
}

// Initialize on load
initStorage();

// ====== CATALOG CATEGORIES =======

export function getCatalogCategories() {
    const defaultCategories = [
        { key: 'all', label: 'הכל', icon: 'fa-tag' }
    ];
    try {
        const stored = localStorage.getItem('vegetable_catalog_categories');
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return defaultCategories;
}

export function saveCatalogCategories(cats) {
    localStorage.setItem('vegetable_catalog_categories', JSON.stringify(cats));
}

