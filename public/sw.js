const CACHE_VERSION = 'v2'
const CACHE_NAME = `caixinhas-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/favicon-32.png',
  '/apple-touch-icon.png',
]

const API_PATH_PREFIXES = ['/_tanstack/', '/_build/']

function isApiRequest(url) {
  return API_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function shouldCache(request) {
  if (request.method !== 'GET') {
    return false
  }

  const url = new URL(request.url)

  if (isApiRequest(url)) {
    return false
  }

  return true
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (!shouldCache(event.request)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(event.request)
        .then((response) => {
          if (!response.ok || response.type === 'opaque') {
            return response
          }

          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy)
          })

          return response
        })
        .catch(() => caches.match('/'))
    }),
  )
})
