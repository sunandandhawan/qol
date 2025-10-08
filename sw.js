const CACHE_NAME = 'qol-v1';

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
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            
            return fetch(event.request).then((fetchResponse) => {
                // Don't cache non-GET requests or non-http(s) requests
                if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
                    return fetchResponse;
                }
                
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            }).catch((error) => {
                console.log('Fetch failed:', error);
                // Return cached version if available
                return caches.match(event.request);
            });
        })
    );
});
