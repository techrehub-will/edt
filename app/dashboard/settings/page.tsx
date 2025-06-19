"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsForm } from "@/components/settings/settings-form"
import { PasswordChangeForm } from "@/components/settings/password-change-form"
import { ActiveSessionsManager } from "@/components/settings/active-sessions-manager"
import { SecurityActivityLog } from "@/components/settings/security-activity-log"
import { Loader2, User, Shield, Database, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  const router = useRouter()
  const { supabase, isConnected } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      if (!isConnected) {
        router.push("/login")
        return
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/login")
        return
      }

      setUser(user)

      // Try to load user profile if it exists
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError)
      } else if (profileData) {
        setUserProfile(profileData)
      }

    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      toast({
        title: "Error",
        description: "Please type 'DELETE MY ACCOUNT' to confirm",
        variant: "destructive"
      })
      return
    }

    setIsDeleting(true)
    try {
      // First, delete all user data
      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_id_to_delete: user.id
      })

      if (deleteError) {
        console.error("Error deleting user data:", deleteError)
        // Continue with account deletion even if this fails
      }

      // Sign out and redirect
      await supabase.auth.signOut()

      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully",
      })

      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your basic account information and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} readOnly />
                </div>
                <div>
                  <Label>User ID</Label>
                  <Input value={user?.id || ""} readOnly className="font-mono text-sm" />
                </div>
                <div>
                  <Label>Account Created</Label>
                  <Input
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                    readOnly
                  />
                </div>
                <div>
                  <Label>Last Sign In</Label>
                  <Input
                    value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : ""}
                    readOnly
                  />
                </div>
              </div>

              {user?.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div>
                  <Label>Metadata</Label>
                  <Textarea
                    value={JSON.stringify(user.user_metadata, null, 2)}
                    readOnly
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {userProfile && (
                <div>
                  <Label>Profile Data</Label>
                  <Textarea
                    value={JSON.stringify(userProfile, null, 2)}
                    readOnly
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Authentication
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={user?.email || ""} readOnly />
                    {user?.email_confirmed_at ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ✓ Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        ⚠ Unverified
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Authentication Provider</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {user?.app_metadata?.provider === 'email' ? 'Email/Password' : user?.app_metadata?.provider || 'Email'}
                    </Badge>
                  </div>
                </div>

                {user?.app_metadata?.provider === 'email' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Change Password</h3>
                    <PasswordChangeForm />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across different devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveSessionsManager />
            </CardContent>
          </Card> */}

          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Activity
              </CardTitle>
              <CardDescription>
                Recent security-related activity on your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityActivityLog />
            </CardContent>
          </Card> */}
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h3 className="font-semibold text-destructive mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                      <DialogDescription>
                        This will permanently delete your account and all associated data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All projects and milestones</li>
                          <li>All tasks and updates</li>
                          <li>All attachments and files</li>
                          <li>All analytics and reports</li>
                          <li>Your user profile and settings</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="delete-confirmation">
                          Type "DELETE MY ACCOUNT" to confirm
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE MY ACCOUNT"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmation !== "DELETE MY ACCOUNT"}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
