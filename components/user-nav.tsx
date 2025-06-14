"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSupabase } from "@/lib/supabase-provider"

interface UserProfile {
  full_name: string
  title?: string
  company?: string
}

export function UserNav({ user }: { user: any }) {
  const router = useRouter()
  const { supabase, isConnected } = useSupabase()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    if (!user || !isConnected) {
      setLoading(false)
      return
    }

    try {
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("full_name, title, company")
        .eq("user_id", user.id)
        .single()

      if (!error && profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (isConnected) {
      try {
        await supabase.auth.signOut()
        router.push("/")
      } catch (error) {
        console.warn("Sign out failed:", error)
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  // Determine display values based on available data
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.email) return user.email.split('@')[0]
    return "User"
  }

  const getDisplayEmail = () => {
    return user?.email || "No email"
  }

  const getInitials = () => {
    const name = getDisplayName()
    if (name === "User" || name === user?.email?.split('@')[0]) {
      return user?.email ? user.email.substring(0, 2).toUpperCase() : "U"
    }
    
    const nameParts = name.split(" ")
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getSubtitle = () => {
    if (loading) return "Loading..."
    if (!isConnected) return "Not signed in"
    if (profile?.title && profile?.company) return `${profile.title} at ${profile.company}`
    if (profile?.title) return profile.title
    if (profile?.company) return profile.company
    return "Complete your profile"
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{getDisplayEmail()}</p>
            <p className="text-xs leading-none text-muted-foreground">{getSubtitle()}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          {isConnected ? "Log out" : "Sign in"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
