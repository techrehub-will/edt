'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseProvider } from "@/lib/supabase-provider"
import Loading from "@/components/loading"

// Dynamically import components that might cause issues
const PWALifecycle = dynamic(() => import("@/components/pwa-lifecycle"), { ssr: false })
const PWAInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt"), { ssr: false })
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })), { ssr: false })
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })), { ssr: false })
const Toaster = dynamic(() => import("@/components/ui/toaster").then(mod => ({ default: mod.Toaster })), { ssr: false })

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SupabaseProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Suspense fallback={<Loading />}>
          <PWALifecycle />
          <PWAInstallPrompt />
          <Analytics />
          <SpeedInsights />
          <Toaster />
        </Suspense>
      </ThemeProvider>
    </SupabaseProvider>
  )
}
