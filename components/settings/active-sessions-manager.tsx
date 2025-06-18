"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { sessionManager, type UserSession } from "@/lib/session-manager"
import { Monitor, Smartphone, Tablet, Loader2, LogOut, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function ActiveSessionsManager() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }
  const loadSessions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Load real sessions from database only
      const realSessions = await sessionManager.getSessions()
      setSessions(realSessions)
      
    } catch (error) {
      console.error("Error loading sessions:", error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    if (sessions.find(s => s.id === sessionId)?.is_current) {
      toast({
        title: "Error",
        description: "Cannot terminate current session",
        variant: "destructive"
      })
      return
    }

    setTerminating(sessionId)
    try {
      const success = await sessionManager.terminateSession(sessionId)
      
      if (success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast({
          title: "Session Terminated",
          description: "The selected session has been terminated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to terminate session",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error terminating session:", error)
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive"
      })
    } finally {
      setTerminating(null)
    }
  }

  const terminateAllOtherSessions = async () => {
    try {
      const currentSession = sessions.find(s => s.is_current)
      const terminatedCount = await sessionManager.terminateAllOtherSessions(
        currentSession?.session_token
      )
      
      if (terminatedCount > 0) {
        // Keep only the current session
        setSessions(prev => prev.filter(s => s.is_current))
        toast({
          title: "Sessions Terminated",
          description: `${terminatedCount} session(s) have been terminated.`,
        })
      } else {
        toast({
          title: "No Sessions",
          description: "No other sessions to terminate.",
        })
      }
    } catch (error) {
      console.error("Error terminating all sessions:", error)
      toast({
        title: "Error",
        description: "Failed to terminate sessions",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Monitor className="h-8 w-8 mx-auto mb-2" />
        <p>No active sessions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your active sessions across all devices
        </p>
        {sessions.filter(s => !s.is_current).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={terminateAllOtherSessions}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Terminate All Others
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getDeviceIcon(session.device_type)}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {session.browser_name || 'Unknown Browser'}
                  </span>
                  {session.is_current && (
                    <Badge variant="default" className="text-xs">
                      Current Session
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                  </span>
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </span>
                  )}
                  {session.ip_address && (
                    <span>IP: {session.ip_address}</span>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1)} • 
                  Created {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            {!session.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => terminateSession(session.id)}
                disabled={terminating === session.id}
                className="text-destructive hover:text-destructive"
              >
                {terminating === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Terminate
                  </>
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          Sessions automatically expire after 30 days of inactivity.
        </p>
      </div>
    </div>
  )
}
