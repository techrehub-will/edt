import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        { error: "Turnstile secret key not configured" },
        { status: 500 }
      )
    }

    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)

    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    const outcome = await result.json()

    if (!outcome.success) {
      return NextResponse.json(
        { error: "Invalid CAPTCHA token" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Turnstile verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
