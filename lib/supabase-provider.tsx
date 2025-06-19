"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { authEventTracker } from "@/lib/auth-event-tracker"

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  isConnected: boolean
  error: string | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let subscription: any = null

    const initializeAuth = async () => {
      try {
        // Test connection first
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn("Supabase connection failed, running in demo mode:", sessionError.message)
          setError("Demo Mode - Database not connected")
          setIsConnected(false)
          return
        } setIsConnected(true)
        setError(null)

        // Initialize auth event tracking for sessions
        authEventTracker.init()

        // Set up auth state listener only if connection works
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          // Handle auth state changes
        })

        subscription = authSubscription
      } catch (err) {
        console.warn("Supabase initialization failed, running in demo mode:", err)
        setError("Demo Mode - Database not connected")
        setIsConnected(false)
      }
    }

    initializeAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase])

  return <Context.Provider value={{ supabase, isConnected, error }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }

  return context
}
