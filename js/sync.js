/**
 * Vegetable Orders Management - Background Sync Layer
 * Handles saving orders when offline and prompting the user to send them when online.
 */
import { showToast, buildOrderMessage } from './utils.js';
import { sendWhatsAppMessage, sendSMSMessage, showGroupPicker, sendEmailMessage } from './messaging.js';

async function openSyncDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('vegetable-orders-db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('pending-orders')) {
                db.createObjectStore('pending-orders', { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Queues an offline order in IndexedDB and registers background sync
 * @param {Object} order 
 */
export async function queueOfflineOrder(order) {
    try {
        const db = await openSyncDB();
        const tx = db.transaction('pending-orders', 'readwrite');
        tx.objectStore('pending-orders').put(order);
        
        // Try to register background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-orders');
        }
    } catch (err) {
        console.error('Failed to queue offline order', err);
    }
}

/**
 * Checks for pending orders and prompts the user to send them
 */
async function checkPendingOrders() {
    // Only check if we are actually online
    if (!navigator.onLine) return;

    try {
        const db = await openSyncDB();
        const tx = db.transaction('pending-orders', 'readonly');
        const store = tx.objectStore('pending-orders');
        const req = store.getAll();
        
        req.onsuccess = async () => {
            const pending = req.result;
            if (pending && pending.length > 0) {
                // We have pending orders. Process the first one
                const order = pending[0]; 
                
                // Show a modern confirm dialog instead of blocking confirm if possible,
                // but for simplicity native confirm works best for strict blocking before they leave app.
                const msg = `יש לך הזמנה ממתינה לספק "${order.supplierName || 'לא ידוע'}" שנוצרה כשהיית ללא אינטרנט. האם תרצה לשלוח אותה עכשיו?`;
                
                if (window.confirm(msg)) {
                    // Delete from pending so we don't ask again
                    const delTx = db.transaction('pending-orders', 'readwrite');
                    delTx.objectStore('pending-orders').delete(order.id);
                    
                    // Execute the requested action
                    if (order._pendingAction === 'whatsapp') {
                        sendWhatsAppMessage(order.supplierPhone, buildOrderMessage(order));
                    } else if (order._pendingAction === 'sms') {
                        sendSMSMessage(order.supplierPhone, buildOrderMessage(order));
                    } else if (order._pendingAction === 'group') {
                        showGroupPicker(buildOrderMessage(order), () => {});
                    } else if (order._pendingAction === 'email') {
                        sendEmailMessage(order.supplierName, '', buildOrderMessage(order)); // Will implement email next
                    }
                } else {
                    // User canceled, maybe ask if they want to discard it?
                    if (window.confirm('האם למחוק את ההזמנה הממתינה? (אם תלחץ ביטול - נשאל אותך שוב בהמשך)')) {
                        const delTx = db.transaction('pending-orders', 'readwrite');
                        delTx.objectStore('pending-orders').delete(order.id);
                    }
                }
            }
        };
    } catch (err) {
        console.error('Failed to check pending orders', err);
    }
}

// Listen for messages from the service worker (e.g. background sync fired)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SYNC_PENDING_ORDER') {
            checkPendingOrders(); 
        }
    });
}

// Check when coming back online while app is open
window.addEventListener('online', () => {
    // Only show toast if there are actually pending orders to avoid spamming
    openSyncDB().then(db => {
        const tx = db.transaction('pending-orders', 'readonly');
        const req = tx.objectStore('pending-orders').getAll();
        req.onsuccess = () => {
            if (req.result && req.result.length > 0) {
                showToast('חזרת לאינטרנט! סנכרון פעיל...', 'info');
                setTimeout(checkPendingOrders, 1000);
            }
        };
    });
});

// Check on initial page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkPendingOrders, 1500);
});
