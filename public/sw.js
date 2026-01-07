
const CACHE_NAME = 'pharmacy-schedule-v1.4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安裝 Service Worker 並快取基本檔案
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 no-cache 確保抓到最新檔案
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' })));
    })
  );
});

// 啟用並清理舊快取
self.addEventListener('activate', (event) => {
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
    }).then(() => self.clients.claim())
  );
});

// 攔截請求 (Network First)
self.addEventListener('fetch', (event) => {
  // 只處理 http/https 請求
  if (!event.request.url.startsWith('http')) return;

  // 對於 API 請求或 Google Fonts，直接透傳不快取
  if (event.request.url.includes('firestore') || event.request.url.includes('googleapis')) {
     return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 重要：如果遇到 401 (Unauthorized) 或 錯誤，不要寫入快取，直接回傳
        // 這樣可以避免錯誤的狀態被存起來
        if (!response || response.status === 401 || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // 網路失敗時，嘗試讀取快取
        return caches.match(event.request);
      })
  );
});
