/**
 * Vegetable Orders - Service Worker
 * Enables offline functionality and caching for PWA.
 */

const CACHE_NAME = 'vegetable-orders-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/new-order.html',
    '/orders-list.html',
    '/suppliers.html',
    '/monthly-report.html',
    '/js/app.js',
    '/js/storage.js',
    '/js/messaging.js',
    '/js/suppliers.js',
    '/js/orders.js',
    '/js/orders-list.js',
    '/js/monthly-report.js',
    '/js/export.js',
    '/manifest.json'
];

// External resources to cache
const EXTERNAL_CACHE_URLS = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap'
];

/**
 * Install event - Cache all static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                // Cache local files
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Install complete');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activate complete');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - Serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    // Fetch fresh version in background for next time
                    fetchAndCache(request);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetchAndCache(request);
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

/**
 * Fetches a resource and caches it for future use.
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);

        // Check if valid response
        if (!response || response.status !== 200) {
            return response;
        }

        // Clone the response (can only be used once)
        const responseToCache = response.clone();

        // Cache the response
        const cache = await caches.open(CACHE_NAME);

        // Only cache same-origin requests and specific external resources
        const url = new URL(request.url);
        const isExternal = EXTERNAL_CACHE_URLS.some(extUrl => request.url.startsWith(extUrl));

        if (url.origin === location.origin || isExternal) {
            cache.put(request, responseToCache);
        }

        return response;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
    }
}

/**
 * Message event - Handle messages from the main app
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[Service Worker] Cache cleared');
        });
    }
});

/**
 * Background sync event - Sync data when back online
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        console.log('[Service Worker] Syncing orders...');
        // Future: Implement background sync logic here
    }
});
