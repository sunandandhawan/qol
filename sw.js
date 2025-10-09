const CACHE_NAME = 'qol-v2';

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        // Network first, then cache strategy for better updates
        fetch(event.request)
            .then((fetchResponse) => {
                // Don't cache non-GET requests or non-http(s) requests
                if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
                    return fetchResponse;
                }
                
                // Clone and cache the response
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            })
            .catch((error) => {
                // If network fails, try cache
                console.log('Network failed, using cache:', error);
                return caches.match(event.request);
            })
    );
});
