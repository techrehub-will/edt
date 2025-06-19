"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Settings, Bell, Moon, Globe, Save, Loader2 } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"

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
    dark_mode: true,
    timezone: "Africa/Harare",
    language: "en",
    weekly_digest: true,
    ai_insights_enabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  // Apply dark mode immediately when changed
  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.dark_mode])

  const loadSettings = async () => {
    try {
      if (!isConnected) {
        setLoading(false)
        return
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()

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
  // Request notification permissions when enabled
  useEffect(() => {
    if (settings.notifications_enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission !== 'granted') {
            setSettings(prev => ({ ...prev, notifications_enabled: false }))
            toast({
              title: "Notifications Blocked",
              description: "Please enable notifications in your browser settings.",
              variant: "destructive"
            })
          }
        })
      } else if (Notification.permission === 'denied') {
        setSettings(prev => ({ ...prev, notifications_enabled: false }))
        toast({
          title: "Notifications Blocked",
          description: "Notifications are blocked. Please enable them in your browser settings.",
          variant: "destructive"
        })
      }
    }
  }, [settings.notifications_enabled, toast])

  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true)

    try {
      if (!isConnected) {
        if (!silent) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to save your settings.",
            variant: "destructive",
          })
        }
        if (!silent) setSaving(false)
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
      } if (!silent) {
        toast({
          title: "Success",
          description: "Settings saved successfully.",
        })

        // Log security activity for settings changes
        await sessionManager.logSecurityActivity(
          'settings_change',
          true,
          'Current session',
          navigator.userAgent,
          {
            timestamp: new Date().toISOString(),
            settings_updated: Object.keys(settings)
          }
        )
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to save settings.",
          variant: "destructive",
        })
      }
    } finally {
      if (!silent) setSaving(false)
    }
  }

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))

    // Show immediate feedback for certain settings
    if (key === 'dark_mode') {
      toast({
        title: value ? "Dark Mode Enabled" : "Light Mode Enabled",
        description: "Theme has been applied immediately.",
      })
    }

    if (key === 'notifications_enabled' && value) {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive browser notifications.",
      })
    }

    if (key === 'ai_insights_enabled') {
      toast({
        title: value ? "AI Insights Enabled" : "AI Insights Disabled",
        description: value
          ? "AI-powered analysis and recommendations are now active."
          : "AI features have been disabled.",
      })
    }
  }

  const testNotification = () => {
    if (!settings.notifications_enabled) {
      toast({
        title: "Notifications Disabled",
        description: "Please enable notifications first.",
        variant: "destructive"
      })
      return
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('EDT - Test Notification', {
        body: 'Your notifications are working correctly!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png'
      })
      toast({
        title: "Test Notification Sent",
        description: "Check if you received the notification.",
      })
    } else {
      toast({
        title: "Notifications Not Available",
        description: "Notifications are not supported or not permitted.",
        variant: "destructive"
      })
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
            </div>            <Switch
              id="notifications_enabled"
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => handleSettingChange('notifications_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates.
              </p>
            </div>            <Switch
              id="email_notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
            />
          </div>          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly_digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your progress and insights.
              </p>
            </div>            <Switch
              id="weekly_digest"
              checked={settings.weekly_digest}
              onCheckedChange={(checked) => handleSettingChange('weekly_digest', checked)}
            />
          </div>

          {/* {settings.notifications_enabled && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={testNotification}
                className="w-full"
              >
                Test Notifications
              </Button>
            </div>
          )} */}
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
            </div>            <Switch
              id="ai_insights_enabled"
              checked={settings.ai_insights_enabled}
              onCheckedChange={(checked) => handleSettingChange('ai_insights_enabled', checked)}
            />
          </div>          {settings.ai_insights_enabled && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ✨ AI Insights Active: The system will now analyze your projects and provide personalized recommendations for improving your development workflow.
                </p>
              </div>
            </div>
          )}
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
            </div>            <Switch
              id="dark_mode"
              checked={settings.dark_mode}
              onCheckedChange={(checked) => handleSettingChange('dark_mode', checked)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">            <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>              <Select
              value={settings.timezone}
              onValueChange={(value) => handleSettingChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>                <SelectContent>
                <SelectItem value="Africa/Harare">Harare, Zimbabwe (GMT+2)</SelectItem>
                <SelectItem value="Africa/Cairo">Cairo, Egypt (GMT+2)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Johannesburg, South Africa (GMT+2)</SelectItem>
                <SelectItem value="Europe/Berlin">Berlin, Germany (GMT+1/+2)</SelectItem>
                <SelectItem value="Europe/Paris">Paris, France (GMT+1/+2)</SelectItem>
                <SelectItem value="Europe/London">London, UK (GMT/+1)</SelectItem>
                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (GMT-5/-4)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (GMT-6/-5)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (GMT-7/-6)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8/-7)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai, UAE (GMT+4)</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai, China (GMT+8)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo, Japan (GMT+9)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney, Australia (GMT+10/+11)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current time: {new Date().toLocaleString('en-US', {
                timeZone: settings.timezone,
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>              <Select
                value={settings.language}
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  {/* <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => handleSave(false)} disabled={saving}>
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
