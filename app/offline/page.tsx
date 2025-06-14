"use client"

import type React from "react"
import { AlertCircle, Wifi, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Wifi className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">You're offline</h1>
            <p className="text-muted-foreground">
              Check your internet connection and try again.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              What you can still do:
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• View previously loaded content</li>
              <li>• Navigate between cached pages</li>
              <li>• Work with offline-enabled features</li>
            </ul>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          This page is available offline thanks to service worker caching
        </div>
      </div>
    </div>
  )
}
