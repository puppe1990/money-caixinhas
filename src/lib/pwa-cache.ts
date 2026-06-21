export const CACHE_VERSION = 'v4'
export const CACHE_NAME = `caixinhas-${CACHE_VERSION}`

export const OFFLINE_URL = '/offline.html'

export const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/favicon-32.png',
  '/apple-touch-icon.png',
]

export const API_PATH_PREFIXES = ['/_tanstack/', '/_build/']

export function isApiRequest(pathname: string): boolean {
  return API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isStaticAsset(pathname: string): boolean {
  return /\.(css|js|png|ico|svg|woff2?|json|html)$/.test(pathname)
}

export type CacheStrategy = 'cache-first' | 'passthrough'

export function getCacheStrategy(
  method: string,
  pathname: string,
  mode: RequestMode,
): CacheStrategy {
  if (method !== 'GET') {
    return 'passthrough'
  }

  if (isApiRequest(pathname)) {
    return 'passthrough'
  }

  // Navigation must bypass the service worker. Caching or serving redirect
  // responses through respondWith() breaks Safari ("Response served by service
  // worker has redirections").
  if (mode === 'navigate') {
    return 'passthrough'
  }

  if (isStaticAsset(pathname)) {
    return 'cache-first'
  }

  return 'passthrough'
}

export type ResponseMeta = {
  status: number
  redirected: boolean
  ok: boolean
}

export function isCacheableResponse(meta: ResponseMeta): boolean {
  return meta.ok && !meta.redirected && meta.status >= 200 && meta.status < 300
}

export function isServeableCachedResponse(status: number): boolean {
  return status >= 200 && status < 300
}
