/**
 * Vegetable Orders — Service Worker v4
 * Full offline support, Background Sync, and complete cache coverage.
 */

const CACHE_NAME = 'vegetable-orders-v4';

const CACHE_URLS = [
    './',
    './index.html',
    './new-order.html',
    './orders-list.html',
    './new-return.html',
    './returns-list.html',
    './suppliers.html',
    './catalog.html',
    './groups.html',
    './monthly-report.html',
    './settings.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/utils.js',
    './js/storage.js',
    './js/theme.js',
    './js/messaging.js',
    './js/config.js',
    './js/db.js',
    './js/sync.js',
    './js/export.js',
    './js/orders.js',
    './js/orders-list.js',
    './js/new-order.js',
    './js/returns.js',
    './js/returns-list.js',
    './js/suppliers.js',
    './js/catalog.js',
    './js/groups.js',
    './js/settings.js',
    './js/monthly-report.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

const EXTERNAL_CACHE_URLS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap'
];

// ===== IndexedDB helper (for Background Sync pending-orders store) =====

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('vegetable-orders-db', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending-orders')) {
                db.createObjectStore('pending-orders', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function idbGetAll(store) {
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbDelete(store, key) {
    return new Promise((resolve, reject) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function syncPendingOrders() {
    const db = await openDB();
    const tx = db.transaction('pending-orders', 'readwrite');
    const store = tx.objectStore('pending-orders');
    const pending = await idbGetAll(store);

    if (pending.length === 0) return;

    // Notify all open app windows so they can process pending orders
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const order of pending) {
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_PENDING_ORDER', order });
        });
        await idbDelete(store, order.id);
    }

    console.log(`[Service Worker] Synced ${pending.length} pending order(s)`);
}

// ===== Install — cache all static assets =====

self.addEventListener('install', (event) => {
    console.log('[Service Worker v4] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_URLS))
            .then(() => {
                console.log('[Service Worker v4] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker v4] Install failed:', error);
            })
    );
});

// ===== Activate — remove old caches =====

self.addEventListener('activate', (event) => {
    console.log('[Service Worker v4] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[Service Worker v4] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            ))
            .then(() => {
                console.log('[Service Worker v4] Activate complete');
                return self.clients.claim();
            })
    );
});

// ===== Fetch — cache-first with network fallback =====

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        caches.match(request)
            .then((cached) => {
                if (cached) {
                    fetchAndCache(request); // refresh in background
                    return cached;
                }
                return fetchAndCache(request);
            })
            .catch(() => {
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

async function fetchAndCache(request) {
    try {
        const response = await fetch(request);

        if (!response || response.status !== 200) return response;

        const responseToCache = response.clone();
        const cache = await caches.open(CACHE_NAME);
        const url = new URL(request.url);
        const isExternal = EXTERNAL_CACHE_URLS.some(ext => request.url.startsWith(ext));

        if (url.origin === location.origin || isExternal) {
            cache.put(request, responseToCache);
        }

        return response;
    } catch (error) {
        console.error('[Service Worker v4] Fetch failed:', error);
        throw error;
    }
}

// ===== Background Sync =====

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        console.log('[Service Worker v4] Background sync: orders');
        event.waitUntil(syncPendingOrders());
    }
});

// ===== Message handling =====

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data?.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[Service Worker v4] Cache cleared');
        });
    }
});
