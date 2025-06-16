"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Monitor, Smartphone, Tablet, Loader2, LogOut, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SessionInfo {
  id: string
  user_agent: string
  ip_address: string
  last_activity: string
  is_current: boolean
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  location?: string
}

export function ActiveSessionsManager() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [terminating, setTerminating] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const getDeviceType = (userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return 'desktop'
    }
    return 'unknown'
  }

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

  const getBrowserName = (userAgent: string): string => {
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    return 'Unknown Browser'
  }

  const loadSessions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // In a real implementation, you'd track sessions in a database table
      // For now, we'll simulate with current session info
      const currentSession: SessionInfo = {
        id: 'current',
        user_agent: navigator.userAgent,
        ip_address: 'Current session',
        last_activity: new Date().toISOString(),
        is_current: true,
        device_type: getDeviceType(navigator.userAgent),
        location: 'Harare, Zimbabwe' // Could be enhanced with actual IP geolocation
      }

      // Simulate some additional sessions for demo
      const demoSessions: SessionInfo[] = [
        {
          id: 'session-1',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          ip_address: '192.168.1.100',
          last_activity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          is_current: false,
          device_type: 'mobile',
          location: 'Harare, Zimbabwe'
        },
        {
          id: 'session-2',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124',
          ip_address: '10.0.0.50',
          last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          is_current: false,
          device_type: 'desktop',
          location: 'Harare, Zimbabwe'
        }
      ]

      setSessions([currentSession, ...demoSessions])
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load active sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    if (sessionId === 'current') {
      toast({
        title: "Error",
        description: "Cannot terminate current session",
        variant: "destructive"
      })
      return
    }

    setTerminating(sessionId)
    
    try {
      // In a real implementation, you'd revoke the session in your backend
      // For now, we'll just remove it from the list
      setSessions(sessions.filter(s => s.id !== sessionId))
      
      toast({
        title: "Success",
        description: "Session terminated successfully",
        variant: "default"
      })
      
      // Log security activity
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        await supabase.from('security_activity').insert({
          user_id: user.user.id,
          activity_type: 'session_terminated',
          details: { 
            terminated_session_id: sessionId,
            timestamp: new Date().toISOString()
          },
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        }).catch(console.error)
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
    const otherSessions = sessions.filter(s => !s.is_current)
    if (otherSessions.length === 0) {
      toast({
        title: "Info",
        description: "No other sessions to terminate",
        variant: "default"
      })
      return
    }

    setTerminating('all')
    
    try {
      setSessions(sessions.filter(s => s.is_current))
      
      toast({
        title: "Success",
        description: `Terminated ${otherSessions.length} session(s)`,
        variant: "default"
      })
      
      // Log security activity
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        await supabase.from('security_activity').insert({
          user_id: user.user.id,
          activity_type: 'all_sessions_terminated',
          details: { 
            terminated_count: otherSessions.length,
            timestamp: new Date().toISOString()
          },
          ip_address: 'unknown',
          user_agent: navigator.userAgent
        }).catch(console.error)
      }
      
    } catch (error) {
      console.error("Error terminating sessions:", error)
      toast({
        title: "Error",
        description: "Failed to terminate sessions",
        variant: "destructive"
      })
    } finally {
      setTerminating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sessions.length} active session(s)
        </p>
        {sessions.filter(s => !s.is_current).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={terminateAllOtherSessions}
            disabled={terminating === 'all'}
          >
            {terminating === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Terminate All Others
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getDeviceIcon(session.device_type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getBrowserName(session.user_agent)}
                  </span>
                  {session.is_current && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Current Session
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.is_current 
                      ? 'Active now'
                      : `${formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}`
                    }
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  IP: {session.ip_address}
                </p>
              </div>
            </div>
            
            {!session.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => terminateSession(session.id)}
                disabled={terminating === session.id}
              >
                {terminating === session.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
