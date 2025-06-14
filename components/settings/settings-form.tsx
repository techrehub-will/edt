"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Settings, Bell, Moon, Globe, Save, Loader2 } from "lucide-react"

interface UserSettings {
  notifications_enabled: boolean
  email_notifications: boolean
  dark_mode: boolean
  timezone: string
  language: string
  weekly_digest: boolean
  ai_insights_enabled: boolean
}

export function SettingsForm() {
  const { supabase, isConnected } = useSupabase()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    dark_mode: false,
    timezone: "America/Los_Angeles",
    language: "en",
    weekly_digest: true,
    ai_insights_enabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])
  const loadSettings = async () => {
    try {
      if (!isConnected) {
        // Redirect to login if not authenticated
        setLoading(false)
        return
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setLoading(false)
        return
      }

      // Load existing settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error loading settings:", settingsError)
      }

      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }
  const handleSave = async () => {
    setSaving(true)

    try {
      if (!isConnected) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your settings.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("User not authenticated")
      }

      const settingsData = {
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("user_settings")
        .upsert(settingsData, {
          onConflict: "user_id",
        })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Settings saved successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications and updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications_enabled">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser.
              </p>
            </div>
            <Switch
              id="notifications_enabled"
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates.
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly_digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your progress and insights.
              </p>
            </div>
            <Switch
              id="weekly_digest"
              checked={settings.weekly_digest}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, weekly_digest: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* AI & Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI & Features
          </CardTitle>
          <CardDescription>
            Configure AI-powered features and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai_insights_enabled">AI Insights</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered analysis and recommendations.
              </p>
            </div>
            <Switch
              id="ai_insights_enabled"
              checked={settings.ai_insights_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, ai_insights_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your experience and regional settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark_mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <Switch
              id="dark_mode"
              checked={settings.dark_mode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, dark_mode: checked })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
