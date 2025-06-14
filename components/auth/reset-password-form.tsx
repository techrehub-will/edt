"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

export function ResetPasswordForm() {  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      setIsValidToken(true)
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    } else {
      setIsValidToken(false)
    }
  }, [searchParams, supabase])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // Clear any previous errors
    
    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      const errorMessage = "Password must be at least 6 characters long"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
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
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      // Redirect to dashboard after successful password reset
      router.push("/dashboard")
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

  if (!isValidToken) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold text-destructive">Invalid or expired link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="space-y-4">
          <Link href="/forgot-password">
            <Button className="w-full">
              Request new reset link
            </Button>
          </Link>
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
          <Label htmlFor="password">New Password</Label>
          <div className="relative">            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null) // Clear error when user types
              }}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (error) setError(null) // Clear error when user types
              }}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Updating..." : "Update password"}
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
