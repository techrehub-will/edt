import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/lib/supabase-provider"
// import { AuthEventTracker } from "@/components/auth-event-tracker"
import PWALifecycle from "@/components/pwa-lifecycle"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'),
  title: {
    default: "Engineering Development Tracker - Track Your Technical Growth",
    template: "%s | EDT - Engineering Development Tracker"
  },
  description: "Boost your engineering career with EDT - the comprehensive platform for tracking technical projects, setting SMART goals, managing tasks, and measuring professional development progress.",
  applicationName: "Engineering Development Tracker",
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: [
    'engineering development tracker',
    'technical project management',
    'software engineer productivity',
    'goal tracking software',
    'engineering career development',
    'project portfolio tracker',
    'technical skills assessment',
    'development milestone tracking',
    'engineering analytics',
    'professional growth platform',
    'coding project organizer',
    'tech career advancement',
    'developer productivity tools'
  ],
  authors: [
    {
      name: 'EDT Team',
      url: 'https://edt.vercel.app'
    }
  ],
  creator: 'EDT Team',
  publisher: 'EDT Team',
  category: 'productivity',
  classification: 'Engineering Development Tools',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/icons/icon-32x32.png',
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/icon-180x180.png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EDT',
    startupImage: [
      '/icons/icon-512x512.png',
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Engineering Development Tracker',
    title: 'Engineering Development Tracker - Track Your Technical Growth & Career Progress',
    description: 'Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics. Join thousands of engineers advancing their careers.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Engineering Development Tracker - Professional Growth Platform',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@EDT_tracker',
    creator: '@EDT_tracker',
    title: 'Engineering Development Tracker - Track Your Technical Growth',
    description: 'Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EDT" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="EDT" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="HandheldFriendly" content="true" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-base.svg" color="#000000" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Engineering Development Tracker",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://edt.vercel.app",
              "description": "Comprehensive platform for tracking technical projects, setting SMART goals, and measuring professional development progress for engineers.",
              "features": [
                "Project tracking and management",
                "Goal setting and milestone tracking",
                "Technical skills assessment",
                "Professional development analytics",
                "Career progress visualization"
              ],
              "screenshot": "/og-image.png",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "250"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <meta name="msvalidate.01" content="CEDC65F3D2DA389E6CDCCF3BEA1898BE" />
        <meta name="yandex-verification" content="0c963589a54adf2e" />
      </head>      <body className={inter.className} suppressHydrationWarning>        <SupabaseProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* <AuthEventTracker /> */}
          <PWALifecycle />
          {children}
          <PWAInstallPrompt />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </SupabaseProvider>
      </body>
    </html>
  )
}
