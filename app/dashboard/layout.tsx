import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null

  try {
    const supabase = createServerClient()

    if (supabase) {
      const { data } = await supabase.auth.getSession()
      session = data.session
    }
  } catch (error) {
    console.warn("Auth check failed:", error)
  }

  // Redirect to login if no session
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen">
      <Sidebar />      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 pt-20 md:pt-4">{children}</main>
      </div>
    </div>
  )
}
