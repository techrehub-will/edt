"use client"

import { useAuthSessionTracking } from "@/hooks/use-auth-session-tracking"

export function AuthSessionTracker({ children }: { children: React.ReactNode }) {
  useAuthSessionTracking()
  return <>{children}</>
}
