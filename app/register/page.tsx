import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { RegisterForm } from "@/components/auth/register-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account - Engineering Development Tracker",
  description:
    "Join EDT today and start tracking your engineering projects, setting SMART goals, and accelerating your technical career development. Free registration.",
  keywords: [
    "engineering career registration",
    "developer account signup",
    "technical project tracker signup",
    "engineering development platform",
    "free engineering tools",
    "career development registration",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Create Account - Engineering Development Tracker",
    description:
      "Join thousands of engineers tracking their career development with EDT. Start your journey today.",
  },
  alternates: {
    canonical: "/register",
  },
}

export default async function RegisterPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-muted-foreground">
            Register for the Engineering Development Tracker
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
