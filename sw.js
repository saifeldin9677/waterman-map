// إصدار الكاش (غيّر الرقم إذا أردت تحديثاً مستقبلاً)
const CACHE_NAME = 'waterman-v5';

// الملفات المحلية فقط (الموجودة في حسابك على GitHub)
const LOCAL_FILES = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// مرحلة التثبيت: نخزن الملفات المحلية فقط (وهي مضمونة النجاح)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('🦋 جاري تخزين الملفات المحلية...');
                return cache.addAll(LOCAL_FILES);
            })
            .then(() => {
                console.log('✅ تم التثبيت بنجاح!');
                return self.skipWaiting(); // ننشط الـ SW فوراً
            })
    );
});

// مرحلة التنشيط: نسيطر على الصفحات فوراً ونحذف الكاش القديم
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
            console.log('✅ Service Worker نشط!');
            return self.clients.claim();
        })
    );
});

// مرحلة الجلب: نعيد الملف المخزن، أو نجلبه من الإنترنت
// وإذا فشل كل شيء في وضع الأوفلاين، نعيد الصفحة الرئيسية بدلاً من 404
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // إذا وجد الملف في الكاش، نعيده فوراً
                if (cachedResponse) {
                    return cachedResponse;
                }
                // وإلا نطلبه من الإنترنت
                return fetch(event.request).catch(() => {
                    // في وضع الأوفلاين، إذا كان المستخدم يطلب صفحة (HTML)، نعيد الصفحة الرئيسية
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    // وإلا نعيد استجابة فارغة (بدون 404) حتى لا يكسر التطبيق
                    return new Response('', { status: 200 });
                });
            })
    );
});
