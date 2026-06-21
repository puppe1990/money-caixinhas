import { describe, expect, it } from 'vitest'

import {
  CACHE_NAME,
  CACHE_VERSION,
  getCacheStrategy,
  isApiRequest,
  isCacheableResponse,
  isServeableCachedResponse,
  isStaticAsset,
  OFFLINE_URL,
  PRECACHE_URLS,
} from '#/lib/pwa-cache'

describe('PWA service worker cache filtering', () => {
  describe('cache versioning', () => {
    it('bumps cache version to invalidate stale redirect entries', () => {
      expect(CACHE_VERSION).toBe('v4')
      expect(CACHE_NAME).toBe('caixinhas-v4')
    })

    it('precaches offline fallback and manifest assets', () => {
      expect(PRECACHE_URLS).toContain(OFFLINE_URL)
      expect(PRECACHE_URLS).toContain('/manifest.json')
    })
  })

  describe('isApiRequest', () => {
    it('identifies TanStack server function URLs as API requests', () => {
      expect(isApiRequest('/_tanstack/server-fn/getCaixinhas')).toBe(true)
      expect(isApiRequest('/_tanstack/server-fn/getHistoricoTransacoes')).toBe(
        true,
      )
    })

    it('does not flag regular page URLs as API', () => {
      expect(isApiRequest('/')).toBe(false)
      expect(isApiRequest('/login')).toBe(false)
    })
  })

  describe('isStaticAsset', () => {
    it('identifies CSS files as static assets', () => {
      expect(isStaticAsset('/assets/styles.css')).toBe(true)
    })

    it('identifies JS files as static assets', () => {
      expect(isStaticAsset('/assets/chunk.js')).toBe(true)
    })

    it('identifies PNG and ICO as static assets', () => {
      expect(isStaticAsset('/logo192.png')).toBe(true)
      expect(isStaticAsset('/favicon.ico')).toBe(true)
    })

    it('identifies JSON and offline HTML as static assets', () => {
      expect(isStaticAsset('/manifest.json')).toBe(true)
      expect(isStaticAsset('/offline.html')).toBe(true)
    })

    it('does not identify HTML pages as static assets', () => {
      expect(isStaticAsset('/')).toBe(false)
      expect(isStaticAsset('/login')).toBe(false)
    })
  })

  describe('getCacheStrategy', () => {
    it('bypasses navigation requests to avoid Safari redirect errors', () => {
      expect(getCacheStrategy('GET', '/', 'navigate')).toBe('passthrough')
      expect(getCacheStrategy('GET', '/login', 'navigate')).toBe('passthrough')
    })

    it('uses cache-first for static assets', () => {
      expect(getCacheStrategy('GET', '/assets/index.js', 'same-origin')).toBe(
        'cache-first',
      )
      expect(getCacheStrategy('GET', '/styles.css', 'same-origin')).toBe(
        'cache-first',
      )
      expect(getCacheStrategy('GET', '/logo192.png', 'same-origin')).toBe(
        'cache-first',
      )
      expect(getCacheStrategy('GET', '/manifest.json', 'same-origin')).toBe(
        'cache-first',
      )
      expect(getCacheStrategy('GET', '/offline.html', 'same-origin')).toBe(
        'cache-first',
      )
    })

    it('uses passthrough for API calls (server functions)', () => {
      expect(
        getCacheStrategy(
          'GET',
          '/_tanstack/server-fn/getCaixinhas',
          'same-origin',
        ),
      ).toBe('passthrough')
      expect(
        getCacheStrategy('GET', '/_tanstack/ssr-data/abc', 'same-origin'),
      ).toBe('passthrough')
      expect(
        getCacheStrategy(
          'POST',
          '/_tanstack/server-fn/createCaixinhaFn',
          'same-origin',
        ),
      ).toBe('passthrough')
    })

    it('uses passthrough for build internal requests', () => {
      expect(
        getCacheStrategy('GET', '/_build/assets/chunk.js', 'same-origin'),
      ).toBe('passthrough')
    })

    it('uses passthrough for non-GET requests', () => {
      expect(getCacheStrategy('POST', '/', 'navigate')).toBe('passthrough')
      expect(getCacheStrategy('POST', '/assets/script.js', 'same-origin')).toBe(
        'passthrough',
      )
    })
  })

  describe('redirect-safe response guards', () => {
    it('rejects redirect responses for caching', () => {
      expect(
        isCacheableResponse({ status: 302, redirected: false, ok: false }),
      ).toBe(false)
      expect(
        isCacheableResponse({ status: 307, redirected: true, ok: false }),
      ).toBe(false)
      expect(
        isCacheableResponse({ status: 200, redirected: true, ok: true }),
      ).toBe(false)
    })

    it('allows only successful final responses for caching', () => {
      expect(
        isCacheableResponse({ status: 200, redirected: false, ok: true }),
      ).toBe(true)
      expect(
        isCacheableResponse({ status: 404, redirected: false, ok: false }),
      ).toBe(false)
    })

    it('only serves cached entries with successful status codes', () => {
      expect(isServeableCachedResponse(200)).toBe(true)
      expect(isServeableCachedResponse(301)).toBe(false)
      expect(isServeableCachedResponse(302)).toBe(false)
      expect(isServeableCachedResponse(404)).toBe(false)
    })
  })
})
