const CACHE_NAME = 'waterman-butterfly-cache-v2'; // غيرت الإصدار لتحديث الكاش

// قائمة الملفات والمكتبات الخارجية
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://d3js.org/d3.v7.min.js',
    'https://cdn.jsdelivr.net/npm/d3-geo-projection@4/dist/d3-geo-projection.min.js',
    'https://cdn.jsdelivr.net/npm/topojson-client@3'
];

// مرحلة التثبيت: تخزين كل ملف على حدة مع تجاهل الأخطاء لضمان نجاح التثبيت
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('🦋 بدء حفظ الملفات في الكاش...');
                // نخزن كل ملف على حدة، وإذا فشل أحدهم نكمل الباقي
                const promises = ASSETS_TO_CACHE.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`⚠️ فشل تخزين ${url}، لكننا نكمل التثبيت`, err);
                    });
                });
                return Promise.all(promises);
            })
            .then(() => {
                console.log('✅ تم تثبيت Service Worker بنجاح');
                return self.skipWaiting();
            })
    );
});

// مرحلة التنشيط: تنظيف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('🗑️ حذف الكاش القديم:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker نشط ويسيطر على الصفحات');
            return self.clients.claim();
        })
    );
});

// مرحلة الجلب: استراتيجية "Cache First" مع محاولة الشبكة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // إذا وجد في الكاش، نعيده فوراً (وهذا يضمن العمل دون اتصال)
                    return cachedResponse;
                }
                // وإلا نطلب من الشبكة
                return fetch(event.request).catch(() => {
                    // في حالة عدم وجود اتصال ولا كاش، نعيد رسالة بسيطة
                    console.warn('📡 لا يوجد اتصال ولا كاش لهذا المورد');
                    return new Response('غير متوفر حالياً', { status: 404 });
                });
            })
    );
});
