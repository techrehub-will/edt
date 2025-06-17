"use client"

import { useEffect } from 'react'

export function AuthEventTracker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Dynamic import to avoid SSR issues
    import('@/lib/auth-event-tracker').then(({ authEventTracker }) => {
      authEventTracker.init()
    }).catch(error => {
      console.error('Failed to initialize auth event tracker:', error)
    })
  }, [])

  // This component renders nothing, it just sets up event tracking
  return null
}
