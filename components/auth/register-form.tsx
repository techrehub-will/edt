"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { AlertCircle, Loader2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) // Clear any previous errors

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      })

      router.push("/login")
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null) // Clear any previous errors

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null) // Clear error when user types
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null) // Clear error when user types
            }}
            required
          />
        </div>        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>      <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Connecting..." : "Continue with Google"}
      </Button>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
