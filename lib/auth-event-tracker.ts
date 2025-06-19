// Auth event tracking for session management
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { sessionManager } from './session-manager'

export class AuthEventTracker {
  private supabase = createClientComponentClient()

  // Initialize auth event tracking
  init() {
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.id)

      if (event === 'SIGNED_IN' && session) {
        // Create session when user signs in
        await this.handleSignIn(session)
      } else if (event === 'SIGNED_OUT') {
        // Handle sign out
        await this.handleSignOut()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update session activity on token refresh
        await this.updateSessionActivity(session)
      }
    })
  }

  private async handleSignIn(session: any) {
    try {
      console.log('Handling sign in, creating session...')
      await sessionManager.createSession(
        session.access_token,
        navigator.userAgent,
        'Current session'
      )
    } catch (error) {
      console.error('Error creating session on sign in:', error)
    }
  }

  private async handleSignOut() {
    try {
      console.log('Handling sign out...')
      await sessionManager.logSecurityActivity('sign_out', true, 'Current session', navigator.userAgent)
    } catch (error) {
      console.error('Error logging sign out:', error)
    }
  }

  private async updateSessionActivity(session: any) {
    try {
      // Update last activity time for current session
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) return

      await this.supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('user_id', user.user.id)
        .eq('session_token', session.access_token)
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }
}

// Export singleton instance
export const authEventTracker = new AuthEventTracker()
