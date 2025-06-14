"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"

export function ForgotPasswordForm() {  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) // Clear any previous errors

    try {      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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

      setIsEmailSent(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      })
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

  if (isEmailSent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder.
          </p>
        </div>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"            onClick={() => {
              setIsEmailSent(false)
              setEmail("")
              setError(null) // Clear errors when resetting
            }}
          >
            Send another email
          </Button>
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
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
        </div>        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  )
}
