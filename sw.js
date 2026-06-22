const CACHE_NAME = 'waterman-butterfly-cache-v1';

// قائمة الملفات والمكتبات الخارجية التي يجب تخزينها داخل الجهاز للعمل دون اتصال
const ASSETS_TO_CACHE = [
    './',
    './index.html', 
    'https://d3js.org/d3.v7.min.js',
    'https://cdn.jsdelivr.net/npm/d3-geo-projection@4/dist/d3-geo-projection.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3'
];

// مرحلة التثبيت: حفظ الملفات والمكتبات في ذاكرة المتصفح العميقة
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('🦋 جاري حفظ ملفات الخريطة في الذاكرة التخزينية...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// مرحلة التنشيط: تنظيف الذاكرة المؤقتة القديمة
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('🦋 تنظيف التخزين المؤقت القديم:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// مرحلة جلب البيانات: عند انقطاع الإنترنت، يتم جلب الخريطة من الذاكرة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).catch(() => {
                console.log('📡 أنت تعمل الآن في وضع الأوفلاين الكامل.');
            });
        })
    );
});
