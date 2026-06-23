// إصدار الكاش (غيّر الرقم كلما أردت تحديثاً جديداً)
const CACHE_NAME = 'waterman-v10';

// الملفات الأساسية التي يجب أن تكون موجودة دائماً (حتى لو فشل التخزين الديناميكي)
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// مرحلة التثبيت: نخزن الملفات الأساسية فقط (لضمان نجاح التثبيت)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('🦋 تخزين الملفات الأساسية...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ تم التثبيت!');
                return self.skipWaiting();
            })
    );
});

// مرحلة التنشيط: نسيطر على الصفحات ونحذف الكاش القديم
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

// مرحلة الجلب: استراتيجية "خزّن كل شيء تلمسه يدك" (Cache First + Dynamic Caching)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // إذا كان الملف موجوداً في الكاش، نعيده فوراً (وهذا يعمل حتى بدون إنترنت)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // إذا لم يكن موجوداً، نجلبه من الإنترنت
                return fetch(event.request).then(response => {
                    // نخزّن نسخة من الملف الذي جلبناه لاستخدامه لاحقاً دون إنترنت
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // في حال عدم وجود إنترنت ولا كاش، نعيد الصفحة الرئيسية بدلاً من خطأ
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return new Response('', { status: 200 });
                });
            })
    );
});
