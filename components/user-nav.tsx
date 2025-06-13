"use client"

import { useRouter } from "next/navigation"
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

export function UserNav({ user }: { user: any }) {
  const router = useRouter()
  const { supabase, isConnected } = useSupabase()

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
      // In demo mode, just redirect
      router.push("/")
    }
  }

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "DE"
  const displayEmail = user?.email || "demo@engineer.com"
  const displayName = user?.user_metadata?.full_name || "Demo Engineer"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
            {!isConnected && <p className="text-xs leading-none text-yellow-600">Demo Mode</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>{isConnected ? "Log out" : "Exit Demo"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
