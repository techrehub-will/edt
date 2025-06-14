'use client'

import { useEffect } from 'react'

interface SEOStructuredDataProps {
  type?: 'landing' | 'dashboard' | 'article'
}

export default function SEOStructuredData({ type = 'landing' }: SEOStructuredDataProps) {
  useEffect(() => {
    if (type === 'landing') {
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#website`,
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app',
            "name": "Engineering Development Tracker",
            "description": "Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics.",
            "potentialAction": [
              {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            ]
          },
          {
            "@type": "WebPage",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#webpage`,
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app',
            "name": "Engineering Development Tracker - Track Your Technical Growth",
            "isPartOf": {
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#website`
            },
            "datePublished": "2024-01-01T00:00:00+00:00",
            "dateModified": new Date().toISOString(),
            "description": "Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics.",
            "breadcrumb": {
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#breadcrumb`
            }
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#breadcrumb`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'
              }
            ]
          },
          {
            "@type": "Organization",
            "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/#organization`,
            "name": "Engineering Development Tracker",
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app',
            "logo": {
              "@type": "ImageObject",
              "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/icons/icon-512x512.png`,
              "width": 512,
              "height": 512
            },
            "sameAs": [
              "https://github.com/techrehub-will/edt"
            ]
          },
          {
            "@type": "SoftwareApplication",
            "name": "Engineering Development Tracker",
            "operatingSystem": "Web Browser",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "250"
            },
            "featureList": [
              "Project tracking and management",
              "Goal setting with SMART methodology",
              "Technical skills assessment",
              "Professional development analytics",
              "Career progress visualization",
              "Task and milestone tracking",
              "Integration capabilities",
              "Real-time progress monitoring"
            ],
            "screenshot": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://edt.vercel.app'}/og-image.png`
          }
        ]
      }

      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"][data-seo="landing"]')
      if (existingScript) {
        existingScript.remove()
      }

      // Add new structured data
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-seo', 'landing')
      script.textContent = JSON.stringify(structuredData)
      document.head.appendChild(script)
    }

    return () => {
      // Cleanup on unmount
      const script = document.querySelector('script[type="application/ld+json"][data-seo="landing"]')
      if (script) {
        script.remove()
      }
    }
  }, [type])

  return null
}
