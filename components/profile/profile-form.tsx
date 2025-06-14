"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Briefcase, MapPin, Calendar, Save, Loader2, Sparkles, Wand2 } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  bio: string
  title: string
  company: string
  location: string
  experience_level: string
  specializations: string[]
  linkedin_url: string
  github_url: string
  phone: string
  timezone: string
  created_at: string
  updated_at: string
}

export function ProfileForm() {
  const router = useRouter()
  const { supabase, isConnected } = useSupabase()
  const { toast } = useToast()
    const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    full_name: "",
    bio: "",
    title: "",
    company: "",
    location: "",
    experience_level: "",
    specializations: [],
    linkedin_url: "",
    github_url: "",
    phone: "",
    timezone: "",
  })
  const [newSpecialization, setNewSpecialization] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])
  const loadProfile = async () => {
    try {
      if (!isConnected) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to manage your profile.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to manage your profile.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      setUser(authUser)

      // Load existing profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError)
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        })
      }

      if (profileData) {
        setProfile(profileData)
      } else {
        // Initialize with basic user data
        setProfile({
          full_name: authUser.user_metadata?.full_name || "",
          bio: "",
          title: "",
          company: "",
          location: "",
          experience_level: "",
          specializations: [],
          linkedin_url: "",
          github_url: "",
          phone: "",
          timezone: "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!isConnected) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your profile.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (!user) {
        throw new Error("User not authenticated")
      }

      const profileData = {
        user_id: user.id,
        email: user.email,
        ...profile,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("user_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        })

      if (error) {
        throw error
      }

      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
        },
      })

      if (updateError) {
        console.warn("Failed to update auth metadata:", updateError)
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profile.specializations?.includes(newSpecialization.trim())) {
      setProfile({
        ...profile,
        specializations: [...(profile.specializations || []), newSpecialization.trim()],
      })
      setNewSpecialization("")
    }
  }
  const removeSpecialization = (spec: string) => {
    setProfile({
      ...profile,
      specializations: profile.specializations?.filter(s => s !== spec) || [],
    })
  }

  const enhanceProfile = async () => {
    setEnhancing(true)
    try {
      const response = await fetch("/api/profile/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to enhance profile")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Enhancement failed")
      }

      const { enhancement } = data

      // Apply the enhanced bio and skills
      setProfile({
        ...profile,
        bio: enhancement.enhancedBio,
        specializations: enhancement.enhancedSkills,
      })

      toast({
        title: "Profile Enhanced!",
        description: `Generated an optimized bio and ${enhancement.enhancedSkills.length} skills based on your activity. Confidence: ${enhancement.confidence}%`,
      })

      // Show suggestions if available
      if (enhancement.suggestions && enhancement.suggestions.length > 0) {
        setTimeout(() => {
          toast({
            title: "AI Suggestions",
            description: enhancement.suggestions.slice(0, 2).join(". "),
          })
        }, 2000)
      }
    } catch (error) {
      console.error("Error enhancing profile:", error)
      toast({
        title: "Enhancement Failed",
        description: "Unable to generate AI-powered suggestions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setEnhancing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "DE"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{profile.full_name || "No name set"}</h3>              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email || "No email"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={profile.title || ""}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company || ""}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Enter your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select
                value={profile.experience_level || ""}
                onValueChange={(value) => setProfile({ ...profile, experience_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                  <SelectItem value="lead">Lead/Principal (10+ years)</SelectItem>
                  <SelectItem value="executive">Executive/C-Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={enhanceProfile}
                disabled={enhancing}
                className="text-xs"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    AI Enhance
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself, your interests, and expertise..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              AI Enhancement analyzes your projects, logs, and goals to generate an optimized bio and skills.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Details
          </CardTitle>
          <CardDescription>
            Add your specializations and professional links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Specializations</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={enhanceProfile}
                disabled={enhancing}
                className="text-xs"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1 h-3 w-3" />
                    Smart Suggest
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="Add a specialization (e.g., React, Python, DevOps)"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
              />
              <Button type="button" onClick={addSpecialization} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.specializations?.map((spec) => (
                <Badge
                  key={spec}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeSpecialization(spec)}
                >
                  {spec} ×
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Smart Suggest" to automatically generate skills based on your technical activities.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={profile.linkedin_url || ""}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                value={profile.github_url || ""}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
