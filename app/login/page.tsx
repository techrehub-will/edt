import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { LoginForm } from "@/components/auth/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Engineering Development Tracker",
  description:
    "Sign in to your EDT account to track your engineering projects, manage goals, and accelerate your technical career development.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign In - Engineering Development Tracker",
    description:
      "Access your engineering development dashboard and continue tracking your technical progress.",
  },
  alternates: {
    canonical: "/login",
  },
}

export default async function LoginPage() {
  const supabase = await createServerClient()
  if (!supabase) {
    // Handle the error or return an error message/component
    return <div>Failed to initialize authentication client.</div>
  }
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
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your Engineering Development Tracker account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
