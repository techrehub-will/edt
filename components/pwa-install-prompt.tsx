'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e)      // Show install prompt after a delay
      setTimeout(() => {
        if (!standalone && typeof window !== 'undefined') {
          // Check if user hasn't dismissed it in this session
          if (sessionStorage.getItem('pwa-install-dismissed') !== 'true') {
            setShowInstallPrompt(true)
          }
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }
  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (typeof window === 'undefined' ||
      isStandalone || 
      (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed') === 'true') || 
      (!deferredPrompt && !isIOS) || 
      !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isIOS ? (
              <Smartphone className="w-6 h-6 text-primary" />
            ) : (
              <Monitor className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Install EDT App
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isIOS 
                ? 'Tap the share button and "Add to Home Screen" for the best experience.'
                : 'Install our app for quick access and offline functionality.'
              }
            </p>
            
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3 h-3" />
                Install Now
              </button>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
