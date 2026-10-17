// Service Worker for Bajeko Chiya Pasal (App Shell & permitted static assets only)
//
// Deploy-aware caching strategy (Vercel keeps every build, but the shell is
// still network-first so a fresh deploy goes live instantly):
//   - App-shell navigations: NETWORK-FIRST (a fresh deploy goes live instantly,
//     refreshes the cached shell, and falls back to cache, then the offline
//     notice).
//   - Static assets: CACHE-FIRST (bundle filenames are content-hashed, so they
//     are immutable and safe to cache).
//   - API + YouTube media requests: never intercepted.
const CACHE_NAME = 'bajeko-chiya-pasal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// Only cache things that are actually static. With an SPA rewrite every path
// answers 200 with the shell, so caching "any successful same-origin GET" would
// also cache arbitrary routes and any future same-origin JSON endpoint.
function isCacheableAsset(url) {
  const { pathname } = new URL(url);
  if (pathname === '/sw.js') return false;            // the SW updates itself
  if (pathname.startsWith('/assets/')) return true;   // content-hashed bundles
  if (pathname.startsWith('/icons/')) return true;    // PWA icons
  return /\.(?:js|mjs|css|svg|png|jpe?g|webp|ico|woff2?|ttf|json|webmanifest|html)$/.test(pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Never intercept cross-origin requests: Supabase (REST + Auth) responses
  // are authenticated and must stay fresh, and YouTube media is uncacheable.
  if (new URL(url).origin !== self.location.origin) {
    return;
  }

  // Do NOT cache legacy API endpoints or media streams either
  if (
    url.includes('/api/') ||
    url.includes('youtube.com') ||
    url.includes('googlevideo.com') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Navigations (the HTML shell): network-first so new deploys go live
  // immediately, refreshing the cached copy as they are served.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Static assets (hashed bundles, icons, fonts): cache-first with lazy fill.
  // Only genuinely static files get stored — see isCacheableAsset().
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.ok && isCacheableAsset(url)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
