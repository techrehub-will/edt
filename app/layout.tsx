import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/lib/supabase-provider"
import PWALifecycle from "@/components/pwa-lifecycle"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Engineering Development Tracker",
  description: "Track your engineering development and technical project contributions",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  keywords: ['engineering', 'development', 'tracker', 'projects', 'goals', 'productivity'],
  authors: [
    { name: 'EDT Team' }
  ],
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EDT',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Engineering Development Tracker',
    title: 'Engineering Development Tracker',
    description: 'Track your engineering development and technical project contributions',
    images: '/icons/icon-512x512.png',
  },
  twitter: {
    card: 'summary',
    title: 'Engineering Development Tracker',
    description: 'Track your engineering development and technical project contributions',
    images: '/icons/icon-512x512.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EDT" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-base.svg" color="#000000" />
      </head>
      <body className={inter.className}>        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <PWALifecycle />
            {children}
            <PWAInstallPrompt />
            <Toaster />
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
