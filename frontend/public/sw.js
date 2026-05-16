/**
 * PestGuard service worker.
 *
 * Strategy:
 * - Cache the app shell (HTML, JS, CSS, icons) at install time so the app
 *   loads even when offline.
 * - For API calls (/api/*) and uploads (/uploads/*) always go to the network —
 *   we don't want stale pest data or stale scan results.
 * - For everything else, try network first, fall back to cache.
 */
const CACHE_NAME = 'pestguard-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API calls or uploads — always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return
  }

  // Don't cache cross-origin (Wikipedia thumbnails, Unsplash photos, etc.)
  if (url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GETs for next time
        if (event.request.method === 'GET' && response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  )
})
