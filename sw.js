/* Spring Valley Dental — Service Worker v2
 * HTML: network-first (always fresh when online; offline fallback).
 * Assets (CSS/JS/img): stale-while-revalidate (fast, and self-updates each
 *   visit so a code change is never permanently stuck in cache).
 * IMPORTANT: bump CACHE_VERSION on every release so old caches are purged.
 */

const CACHE_VERSION = 'svd-v8'; /* v8 June 2026: Spanish doctor order (Houshmand first) on index+about, Spanish Meet-the-doctors band, emergency open-now banner removed, contact page reordered (request form first) */
const STATIC_CACHE  = CACHE_VERSION + '-static';
const PAGE_CACHE    = CACHE_VERSION + '-pages';

const PRECACHE_ASSETS = [
  '/css/styles.min.css',
  '/js/core.min.js',
  '/js/analytics.min.js',
  '/js/site-config.min.js',
  '/js/hero-carousel.min.js',
  '/js/contact-form.min.js',
  '/js/page-extras.min.js',
  '/js/open-now.min.js',
  '/js/contacto-form.min.js',
  '/images/icons-sprite.svg',
  '/images/spring-valley-logo-desktop.svg',
  '/images/favicon.svg',
  '/data/reviews.json',
  '/offline.html'
];

/* Install: precache resiliently (one missing file won't brick install). */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

/* Activate: delete every cache that isn't the current version. */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const accept = req.headers.get('Accept') || '';

  /* HTML: network-first, fall back to cached page, then offline page. */
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(PAGE_CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  /* Assets: stale-while-revalidate. */
  event.respondWith(
    caches.open(STATIC_CACHE).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
