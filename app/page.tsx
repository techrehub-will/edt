import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import LandingPage from "@/components/landing-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Engineering Development Tracker - Track Your Technical Growth & Career Progress",
  description: "Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics. Join thousands of engineers advancing their careers with EDT.",
  keywords: [
    "engineering development tracker",
    "technical project management",
    "software engineer productivity",
    "goal tracking software",
    "engineering career development",
    "project portfolio tracker",
    "technical skills assessment",
    "development milestone tracking"
  ],
  openGraph: {
    title: "Engineering Development Tracker - Track Your Technical Growth",
    description: "Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Engineering Development Tracker Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Development Tracker - Track Your Technical Growth",
    description: "Accelerate your engineering career with comprehensive project tracking, goal management, and professional development analytics.",
    images: ["/twitter-image.png"]
  },
  alternates: {
    canonical: "/"
  }
}

export default async function Home() {
  const supabase = await createServerClient()
  
  if (!supabase) {
    return <LandingPage />
  }
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return <LandingPage />
}
