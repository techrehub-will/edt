import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Check if this is a password reset callback
  if (type === "recovery") {
    // Redirect to reset password page with the tokens
    const accessToken = requestUrl.searchParams.get("access_token")
    const refreshToken = requestUrl.searchParams.get("refresh_token")
    
    if (accessToken && refreshToken) {
      return NextResponse.redirect(
        new URL(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}`, request.url)
      )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
