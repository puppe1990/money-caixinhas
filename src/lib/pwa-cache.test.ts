import { describe, expect, it } from 'vitest'

const API_PATH_PREFIXES = ['/_tanstack/', '/_build/']

function isApiRequest(pathname: string): boolean {
  return API_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function shouldCache(method: string, pathname: string): boolean {
  if (method !== 'GET') {
    return false
  }

  if (isApiRequest(pathname)) {
    return false
  }

  return true
}

describe('PWA service worker cache filtering', () => {
  describe('isApiRequest', () => {
    it('identifies TanStack server function URLs as API requests', () => {
      expect(isApiRequest('/_tanstack/server-fn/getCaixinhas')).toBe(true)
      expect(isApiRequest('/_tanstack/server-fn/getHistoricoTransacoes')).toBe(
        true,
      )
    })

    it('identifies TanStack SSR data URLs as API requests', () => {
      expect(isApiRequest('/_tanstack/ssr-data/abc123')).toBe(true)
    })

    it('identifies build asset URLs as API/internal', () => {
      expect(isApiRequest('/_build/assets/index.js')).toBe(true)
    })

    it('does not flag regular page URLs as API', () => {
      expect(isApiRequest('/')).toBe(false)
      expect(isApiRequest('/login')).toBe(false)
      expect(isApiRequest('/manifest.json')).toBe(false)
    })

    it('does not flag static assets as API', () => {
      expect(isApiRequest('/logo192.png')).toBe(false)
      expect(isApiRequest('/logo512.png')).toBe(false)
      expect(isApiRequest('/favicon.ico')).toBe(false)
      expect(isApiRequest('/apple-touch-icon.png')).toBe(false)
    })

    it('does not flag stylesheet URLs as API', () => {
      expect(isApiRequest('/styles.css')).toBe(false)
    })
  })

  describe('shouldCache', () => {
    it('caches GET requests to the app root', () => {
      expect(shouldCache('GET', '/')).toBe(true)
    })

    it('caches GET requests to static assets', () => {
      expect(shouldCache('GET', '/manifest.json')).toBe(true)
      expect(shouldCache('GET', '/logo192.png')).toBe(true)
      expect(shouldCache('GET', '/favicon.ico')).toBe(true)
    })

    it('caches GET requests to app pages', () => {
      expect(shouldCache('GET', '/login')).toBe(true)
    })

    it('does NOT cache server function GET calls', () => {
      expect(shouldCache('GET', '/_tanstack/server-fn/getCaixinhas')).toBe(
        false,
      )
      expect(
        shouldCache('GET', '/_tanstack/server-fn/getHistoricoTransacoes'),
      ).toBe(false)
    })

    it('does NOT cache SSR data requests', () => {
      expect(shouldCache('GET', '/_tanstack/ssr-data/some-hash')).toBe(false)
    })

    it('does NOT cache any _tanstack prefixed requests', () => {
      expect(shouldCache('GET', '/_tanstack/anything')).toBe(false)
    })

    it('does NOT cache build asset requests', () => {
      expect(shouldCache('GET', '/_build/assets/chunk.js')).toBe(false)
    })

    it('does NOT cache non-GET requests', () => {
      expect(shouldCache('POST', '/')).toBe(false)
      expect(shouldCache('PUT', '/')).toBe(false)
      expect(shouldCache('DELETE', '/')).toBe(false)
      expect(shouldCache('POST', '/manifest.json')).toBe(false)
    })

    it('does NOT cache POST server function calls', () => {
      expect(shouldCache('POST', '/_tanstack/server-fn/createCaixinhaFn')).toBe(
        false,
      )
      expect(shouldCache('POST', '/_tanstack/server-fn/addDepositoFn')).toBe(
        false,
      )
      expect(shouldCache('POST', '/_tanstack/server-fn/updateCaixinhaFn')).toBe(
        false,
      )
    })
  })
})
