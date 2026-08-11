/*
 * عامل الخدمة: يتيح تصفّح المنصّة دون اتصال بعد أول زيارة.
 *
 * نطاقه أصلُ هذه المنصّة وحده (المضيف + المنفذ)، ومخزونه باسمٍ خاصّ بها،
 * فلا يعترض أي موقعٍ آخر ولو كان على المضيف نفسه بمنفذٍ مختلف.
 */

const CACHE = 'arudi-cache-v1';
const CORE = [
  '/',
  '/analyze',
  '/buhur',
  '/taf3ilat',
  '/training',
  '/lessons',
  '/offline',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('arudi-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // طلبات التحليل: الشبكة أولاً، فإن تعذّرت فآخر نسخة محفوظة
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // الصفحات والأصول: المحفوظ أولاً مع تحديثٍ في الخلفية
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          // صفحةٌ لم تُزَر من قبل ولا اتصال: نعرض صفحة انقطاع الاتصال
          cached || (request.mode === 'navigate' ? caches.match('/offline') : undefined),
        );
      return cached || network;
    }),
  );
});
