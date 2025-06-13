import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { RegisterForm } from "@/components/auth/register-form"

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
          <p className="mt-2 text-muted-foreground">Register for the Engineering Development Tracker</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
