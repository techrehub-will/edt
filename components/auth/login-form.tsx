"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { AlertCircle, Loader2 } from "lucide-react"
import Turnstile from "react-turnstile"

export function LoginForm() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) // Clear any previous errors

    if (!turnstileToken) {
      setError("Please complete the CAPTCHA")
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Please complete the CAPTCHA",
        variant: "destructive",
      })
      return
    }

    try {
      // First verify the Turnstile token
      const verifyResponse = await fetch("/api/auth/turnstile/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.success) {
        throw new Error(verifyResult.error || "CAPTCHA verification failed")
      }

      // If CAPTCHA is valid, proceed with login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

      router.push("/dashboard")
      router.refresh()
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

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null) // Clear any previous errors

    try {
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback'
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
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
    } finally {
      setIsLoading(false)
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
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-center">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => {
                setError("CAPTCHA verification failed")
                setTurnstileToken(null)
              }}
              onExpire={() => {
                setTurnstileToken(null)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button disabled={isLoading || !turnstileToken} type="submit">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In with Google
            </Button>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
