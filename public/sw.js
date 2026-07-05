// Last Cathar — Service Worker (minimal)
// Purpose: satisfy PWA install requirements + light offline shell caching.
// The main app requires network (Cesium terrain tiles, Wikipedia images, API routes),
// so we deliberately keep caching light.

const CACHE_VERSION = 'lc-v7'
const APP_SHELL = ['/', '/pricing', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API routes, auth, Cesium tiles, or 3rd party
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/cesium/') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  // Navigation requests: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(request, clone).catch(() => {}))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/'))),
    )
    return
  }

  // Static assets: stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|svg|jpg|jpeg|webp|ico|woff2?|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone).catch(() => {}))
            return res
          })
          .catch(() => cached)
        return cached || fetchPromise
      }),
    )
  }
})
