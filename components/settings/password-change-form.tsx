"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Eye, EyeOff, Loader2, Key } from "lucide-react"

export function PasswordChangeForm() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number"
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return "Password must contain at least one special character (@$!%*?&)"
    }
    return null
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      })
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      toast({
        title: "Invalid Password",
        description: passwordError,
        variant: "destructive"
      })
      return
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        variant: "destructive"
      })
      return
    }

    setIsChanging(true)
    
    try {
      // First verify current password by attempting to sign in
      const { data: user } = await supabase.auth.getUser()
      if (!user.user?.email) {
        throw new Error("No user email found")
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword
      })

      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        })
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        })
        return
      }

      // Log security activity
      await supabase.from('security_activity').insert({
        user_id: user.user.id,
        activity_type: 'password_change',
        details: { timestamp: new Date().toISOString() },
        ip_address: 'unknown', // Could be enhanced with actual IP detection
        user_agent: navigator.userAgent
      }).catch(console.error) // Don't fail if logging fails

      toast({
        title: "Success",
        description: "Password changed successfully",
        variant: "default"
      })

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {newPassword && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className={newPassword.length >= 8 ? "text-green-600" : "text-red-600"}>
              ✓ At least 8 characters
            </p>
            <p className={/(?=.*[a-z])/.test(newPassword) ? "text-green-600" : "text-red-600"}>
              ✓ One lowercase letter
            </p>
            <p className={/(?=.*[A-Z])/.test(newPassword) ? "text-green-600" : "text-red-600"}>
              ✓ One uppercase letter
            </p>
            <p className={/(?=.*\d)/.test(newPassword) ? "text-green-600" : "text-red-600"}>
              ✓ One number
            </p>
            <p className={/(?=.*[@$!%*?&])/.test(newPassword) ? "text-green-600" : "text-red-600"}>
              ✓ One special character (@$!%*?&)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-600">Passwords don't match</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isChanging || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        className="w-full"
      >
        {isChanging ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Changing Password...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </>
        )}
      </Button>
    </form>
  )
}
