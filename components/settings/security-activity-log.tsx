"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Key, LogIn, LogOut, Settings, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SecurityActivity {
  id: string
  activity_type: string
  timestamp: string
  ip_address?: string
  user_agent?: string
  details?: any
  success: boolean
}

export function SecurityActivityLog() {
  const [activities, setActivities] = useState<SecurityActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  let supabase: any = null
  
  try {
    const context = useSupabase()
    supabase = context.supabase
  } catch (err) {
    console.error("Failed to get supabase context:", err)
  }

  useEffect(() => {
    if (supabase) {
      loadSecurityActivity()
    } else {
      setLoading(false)
      setError("Database connection not available")
    }
  }, [supabase])

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
      case 'sign_in':
        return <LogIn className="h-4 w-4 text-green-600" />
      case 'logout':
      case 'sign_out':
        return <LogOut className="h-4 w-4 text-gray-600" />
      case 'password_change':
        return <Key className="h-4 w-4 text-blue-600" />
      case 'settings_change':
        return <Settings className="h-4 w-4 text-purple-600" />
      case 'session_terminated':
      case 'all_sessions_terminated':
        return <Shield className="h-4 w-4 text-orange-600" />
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityDescription = (activity: SecurityActivity) => {
    switch (activity.activity_type) {
      case 'login':
      case 'sign_in':
        return 'Signed in to account'
      case 'logout':
      case 'sign_out':
        return 'Signed out of account'
      case 'password_change':
        return 'Password changed'
      case 'settings_change':
        return `Settings updated: ${activity.details?.setting || 'Unknown setting'}`
      case 'session_terminated':
        return 'Session terminated'
      case 'all_sessions_terminated':
        return `All other sessions terminated (${activity.details?.terminated_count || 0} sessions)`
      case 'failed_login':
        return 'Failed login attempt'
      case 'account_created':
        return 'Account created'
      case 'email_verified':
        return 'Email address verified'
      case 'profile_updated':
        return 'Profile information updated'
      default:
        return activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }
  const getActivityVariant = (activityType: string, success: boolean): "default" | "secondary" | "destructive" | "outline" => {
    if (!success) return 'destructive'
    
    switch (activityType) {
      case 'login':
      case 'sign_in':
      case 'account_created':
      case 'email_verified':
        return 'default'
      case 'password_change':
      case 'settings_change':
        return 'secondary'
      case 'session_terminated':
      case 'all_sessions_terminated':
        return 'outline'
      case 'logout':
      case 'sign_out':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Browser'
      const ua = userAgent.toLowerCase()
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    return 'Unknown Browser'
  }
  const loadSecurityActivity = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Load real security activity from the database only
      const { data: securityData, error: securityError } = await supabase
        .from('security_activity')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (securityError && securityError.code !== 'PGRST116') {
        console.error('Error loading security activity:', securityError)
        setActivities([])
        return
      }      // Only use real data from database
      if (securityData && securityData.length > 0) {
        const mappedActivities = securityData
          .filter((activity: any) => activity && activity.id) // Ensure valid activities
          .map((activity: any) => ({
            id: activity.id,
            activity_type: activity.activity_type || 'unknown',
            timestamp: activity.created_at || new Date().toISOString(),
            ip_address: activity.ip_address,
            user_agent: activity.user_agent,
            details: activity.details || {},
            success: activity.success !== false // Default to true if not explicitly false
          }))
        setActivities(mappedActivities)
      } else {
        // No demo data - show empty state
        setActivities([])
      }
    } catch (error) {
      console.error("Error loading security activity:", error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
        <p>{error}</p>
        <p className="text-xs mt-2">Security monitoring is temporarily unavailable.</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2" />
        <p>No security activity found</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        if (!activity || !activity.id) return null
        
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 border rounded-lg"
          >
            <div className="mt-1">
              {getActivityIcon(activity.activity_type)}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {getActivityDescription(activity)}
                </span>
                <Badge variant={getActivityVariant(activity.activity_type, activity.success)}>
                  {activity.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime()) 
                    ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                    : 'Unknown time'
                  }
                </span>
                {activity.ip_address && (
                  <span>IP: {activity.ip_address}</span>
                )}
                {activity.user_agent && (
                  <span>{getBrowserInfo(activity.user_agent)}</span>
                )}
              </div>
              
              {activity.details && typeof activity.details === 'object' && Object.keys(activity.details).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {JSON.stringify(activity.details, null, 2)}
                </div>
              )}
            </div>
          </div>
        )
      })}
      
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Showing recent security activity. Activities are retained for 90 days.
        </p>
      </div>
    </div>
  )
}
