import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient, getMockSession } from "@/lib/supabase-server"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  let isDemoMode = false

  try {
    const supabase = createServerClient()

    if (supabase) {
      const { data } = await supabase.auth.getSession()
      session = data.session
    }

    if (!session) {
      // Use mock session for demo mode
      session = getMockSession()
      isDemoMode = true
    }
  } catch (error) {
    console.warn("Auth check failed, using demo mode:", error)
    session = getMockSession()
    isDemoMode = true
  }

  // Only redirect if we're not in demo mode and have no session
  if (!session && !isDemoMode) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        {isDemoMode && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <p className="text-sm text-yellow-800">
              🚀 <strong>Demo Mode</strong> - You're viewing a preview of the Engineering Development Tracker. Connect
              to Supabase to enable full functionality.
            </p>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
