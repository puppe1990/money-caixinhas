import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    let refreshing = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        return
      }
      refreshing = true
      window.location.reload()
    })

    async function register() {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) {
          return
        }

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })
    }

    register().catch(() => {})
  }, [])

  return null
}
