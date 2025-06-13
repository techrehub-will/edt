"use client"
import { SearchBar } from "@/components/ui/search-bar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { useSupabase } from "@/lib/supabase-provider"
import { useEffect, useState } from "react"

export default function Header() {
  const { supabase, isConnected } = useSupabase()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      if (isConnected) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          setUser(user)
        } catch (error) {
          console.warn("Failed to get user:", error)
          // Use demo user
          setUser({
            id: "demo-user-123",
            email: "demo@engineer.com",
            user_metadata: { full_name: "Demo Engineer" },
          })
        }
      } else {
        // Use demo user
        setUser({
          id: "demo-user-123",
          email: "demo@engineer.com",
          user_metadata: { full_name: "Demo Engineer" },
        })
      }
    }

    getUser()
  }, [supabase, isConnected])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex flex-1 items-center space-x-4">
          <SearchBar />
        </div>
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <ModeToggle />
          {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  )
}
