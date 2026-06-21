import { describe, expect, it } from 'vitest'

const API_PATH_PREFIXES = ['/_tanstack/', '/_build/']

function isApiRequest(pathname: string): boolean {
  return API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isStaticAsset(pathname: string): boolean {
  return /\.(css|js|png|ico|svg|woff2?|json)$/.test(pathname)
}

type CacheStrategy = 'network-first' | 'cache-first' | 'passthrough'

function getCacheStrategy(
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

  if (mode === 'navigate') {
    return 'network-first'
  }

  if (isStaticAsset(pathname)) {
    return 'cache-first'
  }

  return 'passthrough'
}

describe('PWA service worker cache filtering', () => {
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

    it('identifies JSON files as static assets', () => {
      expect(isStaticAsset('/manifest.json')).toBe(true)
    })

    it('does not identify HTML pages as static assets', () => {
      expect(isStaticAsset('/')).toBe(false)
      expect(isStaticAsset('/login')).toBe(false)
    })
  })

  describe('getCacheStrategy', () => {
    it('uses network-first for navigation requests (HTML pages)', () => {
      expect(getCacheStrategy('GET', '/', 'navigate')).toBe('network-first')
      expect(getCacheStrategy('GET', '/login', 'navigate')).toBe(
        'network-first',
      )
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
})
