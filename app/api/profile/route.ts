import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
    })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.full_name || !body.email) {
      return NextResponse.json(
        { success: false, error: "Full name and email are required" },
        { status: 400 }
      )
    }

    // Prepare profile data
    const profileData = {
      user_id: user.id,
      email: user.email,
      full_name: body.full_name,
      bio: body.bio || "",
      title: body.title || "",
      company: body.company || "",
      location: body.location || "",
      experience_level: body.experience_level || "",
      specializations: body.specializations || [],
      linkedin_url: body.linkedin_url || "",
      github_url: body.github_url || "",
      phone: body.phone || "",
      timezone: body.timezone || "",
      updated_at: new Date().toISOString(),
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profileData, {
        onConflict: "user_id",
      })

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      )
    }

    // Update auth user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: body.full_name,
      },
    })

    if (updateError) {
      console.warn("Failed to update auth metadata:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
