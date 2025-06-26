// Hook to handle authentication state changes and session tracking
import { useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { sessionManager } from "@/lib/session-manager"

export function useAuthSessionTracking() {
  const { supabase } = useSupabase()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User signed in, create session
          const timestamp = new Date().getTime()
          const randomId = Math.random().toString(36).substr(2, 9)
          const sessionToken = session.access_token || `session_${timestamp}_${randomId}`

          await sessionManager.createSession(
            sessionToken,
            typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            'Current session' // In production, you'd get real IP
          )

          // Log sign-in activity
          await sessionManager.logSecurityActivity(
            'sign_in',
            true,
            'Current session',
            navigator.userAgent,
            {
              timestamp: new Date().toISOString(),
              session_token: sessionToken
            }
          )
        } else if (event === 'SIGNED_OUT') {
          // User signed out, log activity
          await sessionManager.logSecurityActivity(
            'sign_out',
            true,
            'Current session',
            navigator.userAgent,
            {
              timestamp: new Date().toISOString()
            }
          )
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])
}
