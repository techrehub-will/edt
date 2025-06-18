// Session management utilities
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  user_agent?: string
  ip_address?: string
  location?: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser_name?: string
  is_current: boolean
  last_activity: string
  created_at: string
  expires_at?: string
}

export interface SecurityActivityItem {
  id: string
  user_id: string
  activity_type: string
  success: boolean
  ip_address?: string
  user_agent?: string
  details?: any
  created_at: string
}

export class SessionManager {
  private supabase = createClientComponentClient()

  // Get device type from user agent
  getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
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

  // Get browser name from user agent
  getBrowserName(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    return 'Unknown Browser'
  }

  // Get approximate location from IP (in a real app, you'd use a geolocation service)
  async getLocationFromIP(ipAddress?: string): Promise<string> {
    // For demo purposes, return a default location
    // In production, you'd integrate with a service like ipstack, ipapi, etc.
    return 'Harare, Zimbabwe'
  }
  // Create or update current session
  async createSession(sessionToken: string, userAgent?: string, ipAddress?: string): Promise<string | null> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return null

      const deviceType = userAgent ? this.getDeviceType(userAgent) : 'unknown'
      const browserName = userAgent ? this.getBrowserName(userAgent) : 'Unknown'
      const location = await this.getLocationFromIP(ipAddress)

      // Try to use the database function first
      try {
        const { data, error } = await this.supabase.rpc('upsert_user_session', {
          p_user_id: user.user.id,
          p_session_token: sessionToken,
          p_user_agent: userAgent,
          p_ip_address: ipAddress,
          p_location: location,
          p_device_type: deviceType,
          p_browser_name: browserName
        })

        if (error) {
          throw error
        }

        // Log the sign-in activity
        await this.logSecurityActivity('sign_in', true, ipAddress, userAgent)
        return data
      } catch (error: any) {
        console.error('Database function failed, using direct insert:', error)
        
        // Fallback to direct insert if the function doesn't exist
        const sessionData = {
          user_id: user.user.id,
          session_token: sessionToken,
          user_agent: userAgent || 'Unknown',
          ip_address: ipAddress || 'Current session',
          location: location,
          device_type: deviceType,
          browser_name: browserName,
          is_current: true,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }

        const { data: insertData, error: insertError } = await this.supabase
          .from('user_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (insertError) {
          console.error('Direct insert also failed:', insertError)
          // If even direct insert fails, the table probably doesn't exist
          return null
        }

        // Log the sign-in activity
        await this.logSecurityActivity('sign_in', true, ipAddress, userAgent)
        return insertData?.id || null
      }
    } catch (error) {
      console.error('Error in createSession:', error)
      return null
    }
  }  // Get all active sessions for current user
  async getSessions(): Promise<UserSession[]> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return []

      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('last_activity', { ascending: false })

      if (error) {
        console.error('Error fetching sessions:', error)
        
        // If table doesn't exist yet, create a current session
        if (error.code === 'PGRST116' || error.message.includes('relation "user_sessions" does not exist')) {
          console.log('Sessions table not found, creating fallback session')
          await this.logSecurityActivity('sign_in', true, 'Current session', navigator.userAgent, {
            note: 'Initial session - sessions table not configured'
          })
        }
        return []
      }

      // If no sessions exist but the table is available, create a current session
      if (!data || data.length === 0) {
        console.log('No sessions in database, attempting to create current session')
        const { data: session } = await this.supabase.auth.getSession()
        if (session.session) {
          try {
            // Create current session
            const sessionId = await this.createSession(
              session.session.access_token,
              navigator.userAgent,
              'Current session'
            )
            
            if (sessionId) {
              // Re-fetch sessions after creating one
              const { data: newData, error: newError } = await this.supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', user.user.id)
                .order('last_activity', { ascending: false })
              
              if (!newError && newData) {
                return newData
              }
            }
          } catch (createError) {
            console.error('Failed to create current session:', createError)
          }
        }
      }

      return data || []
    } catch (error) {
      console.error('Error in getSessions:', error)
      return []
    }
  }

  // Terminate a specific session
  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return false

      const { data, error } = await this.supabase.rpc('terminate_user_session', {
        p_user_id: user.user.id,
        p_session_id: sessionId
      })

      if (error) {
        console.error('Error terminating session:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in terminateSession:', error)
      return false
    }
  }

  // Terminate all other sessions
  async terminateAllOtherSessions(currentSessionToken?: string): Promise<number> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return 0

      const { data, error } = await this.supabase.rpc('terminate_all_other_sessions', {
        p_user_id: user.user.id,
        p_current_session_token: currentSessionToken
      })

      if (error) {
        console.error('Error terminating all sessions:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in terminateAllOtherSessions:', error)
      return 0
    }
  }

  // Update session activity timestamp
  async updateSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('update_session_activity', {
        p_session_token: sessionToken
      })

      if (error) {
        console.error('Error updating session activity:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in updateSessionActivity:', error)
      return false
    }
  }

  // Log security activity
  async logSecurityActivity(
    activityType: string, 
    success: boolean = true, 
    ipAddress?: string, 
    userAgent?: string, 
    details: any = {}
  ): Promise<string | null> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return null

      const { data, error } = await this.supabase.rpc('log_security_activity', {
        p_user_id: user.user.id,
        p_activity_type: activityType,
        p_success: success,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_details: details
      })

      if (error) {
        console.error('Error logging security activity:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in logSecurityActivity:', error)
      return null
    }
  }

  // Get security activity for current user
  async getSecurityActivity(limit: number = 20): Promise<SecurityActivityItem[]> {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return []

      const { data, error } = await this.supabase
        .from('security_activity')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching security activity:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getSecurityActivity:', error)
      return []
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager()
