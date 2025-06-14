'use client'

import { useEffect } from 'react'

export default function PWALifecycle() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox

      // Add event listeners to handle PWA update scenarios
      const promptNewVersionAvailable = () => {
        // eslint-disable-next-line no-console
        if (confirm('A newer version of this web app is available, reload to update?')) {
          wb.messageSkipWaiting()
          window.location.reload()
        }
      }

      const handleUpdate = () => {
        // Auto-update the app
        wb.messageSkipWaiting()
        window.location.reload()
      }

      wb.addEventListener('waiting', promptNewVersionAvailable)
      wb.addEventListener('controlling', handleUpdate)

      // Register the service worker
      wb.register()
    }
  }, [])

  return null
}
