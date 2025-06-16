"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'

interface UserSettings {
  notifications_enabled: boolean
  email_notifications: boolean
  dark_mode: boolean
  timezone: string
  language: string
  weekly_digest: boolean
  ai_insights_enabled: boolean
}

interface SettingsContextType {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  loading: boolean
}

const defaultSettings: UserSettings = {
  notifications_enabled: true,
  email_notifications: true,
  dark_mode: false,
  timezone: "Africa/Harare",
  language: "en",
  weekly_digest: true,
  ai_insights_enabled: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected } = useSupabase()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [isConnected])

  // Apply dark mode whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
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

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      if (!isConnected) return

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("User not authenticated")
      }

      const settingsData = {
        user_id: user.id,
        ...updatedSettings,
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
    } catch (error) {
      console.error("Error saving settings:", error)
      // Revert settings on error
      setSettings(settings)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
