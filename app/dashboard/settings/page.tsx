"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
  department: z.string().min(1, {
    message: "Please select a department.",
  }),
  bio: z
    .string()
    .max(500, {
      message: "Bio must not be longer than 500 characters.",
    })
    .optional(),
})

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  emailNotifications: z.boolean().default(true),
})

const accountFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function SettingsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("profile")

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      department: "",
      bio: "",
    },
  })

  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "system",
      emailNotifications: true,
    },
  })

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          // Fetch user profile from a profiles table if you have one
          // For now, we'll just use the auth user data
          profileForm.reset({
            name: user.user_metadata?.name || "",
            email: user.email || "",
            role: user.user_metadata?.role || "Engineer",
            department: user.user_metadata?.department || "Engineering",
            bio: user.user_metadata?.bio || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserProfile()
  }, [supabase, profileForm])

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: values.email,
        data: {
          name: values.name,
          role: values.role,
          department: values.department,
          bio: values.bio,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onAppearanceSubmit(
    values: z.infer<typeof appearanceFormSchema>
  ) {
    setIsLoading(true)

    try {
      // In a real app, you would save these preferences to a user_preferences table
      // For now, we'll just show a success message
      toast({
        title: "Preferences updated",
        description:
          "Your appearance preferences have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onAccountSubmit(values: z.infer<typeof accountFormSchema>) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      })

      accountForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
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
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Manage your account settings.</p>

      {/* Add Tab Navigation and Form Content here using the forms and state defined above */}
      <div className="mt-6">
        {/* Placeholder for actual form implementation */}
        <p>Active Tab: {activeTab}</p>
        <p>
          Implement the UI for the forms here based on the `activeTab` state.
        </p>
      </div>
    </div>
  )
}
