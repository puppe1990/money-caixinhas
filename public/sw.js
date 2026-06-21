const CACHE_VERSION = 'v3'
const CACHE_NAME = `caixinhas-${CACHE_VERSION}`

const PRECACHE_URLS = [
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

function isStaticAsset(url) {
  return /\.(css|js|png|ico|svg|woff2?|json)$/.test(url.pathname)
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (isApiRequest(url)) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy)
          })
          return response
        })
        .catch(() =>
          caches.match(event.request).then((c) => c || caches.match('/')),
        ),
    )
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (!response.ok) {
              return response
            }
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy)
            })
            return response
          })
        )
      }),
    )
  }
})
