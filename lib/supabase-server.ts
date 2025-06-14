import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createServerClient = async () => {
  try {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ 
      cookies: () => cookieStore 
    })
  } catch (error) {
    console.warn("Server Supabase client creation failed:", error)
    // Return a mock client for demo purposes
    return null
  }
}

// Mock session for demo mode
export const getMockSession = () => ({
  user: {
    id: "demo-user-123",
    email: "demo@engineer.com",
    user_metadata: {
      full_name: "Demo Engineer",
    },
  },
  access_token: "demo-token",
  expires_at: Date.now() + 3600000,
})
