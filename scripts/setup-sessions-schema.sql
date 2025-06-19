-- Combined Schema Setup for User Sessions and Security Activity
-- Run this script in your Supabase SQL Editor

-- First, create the security_activity table and functions
-- This is required for the session management functions to work

-- Security Activity Table
CREATE TABLE IF NOT EXISTS security_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN (
      'sign_in',
      'sign_out', 
      'password_change',
      'email_change',
      'profile_update',
      'settings_change',
      'session_terminated',
      'all_sessions_terminated',
      'failed_login',
      'account_created',
      'account_deleted',
      'email_verified',
      'password_reset_requested',
      'password_reset_completed',
      'two_factor_enabled',
      'two_factor_disabled'
    )
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_activity_user_id ON security_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_security_activity_timestamp ON security_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_security_activity_type ON security_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_security_activity_success ON security_activity(success);

-- Enable Row Level Security
ALTER TABLE security_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_activity
CREATE POLICY "Users can view their own security activity" ON security_activity
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security activity" ON security_activity
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Log security activity function
CREATE OR REPLACE FUNCTION log_security_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO security_activity (
    user_id,
    activity_type,
    success,
    ip_address,
    user_agent,
    details
  )
  VALUES (
    p_user_id,
    p_activity_type,
    p_success,
    p_ip_address,
    p_user_agent,
    p_details
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  location TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser_name TEXT,
  is_current BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure only one current session per user
  CONSTRAINT unique_current_session_per_user 
    EXCLUDE (user_id WITH =) WHERE (is_current = true)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_current ON user_sessions(is_current) WHERE is_current = true;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to create or update a session
CREATE OR REPLACE FUNCTION upsert_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'unknown',
  p_browser_name TEXT DEFAULT 'Unknown',
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- First, mark all other sessions as not current for this user
  UPDATE user_sessions 
  SET is_current = false 
  WHERE user_id = p_user_id AND is_current = true;
  
  -- Insert or update the session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    user_agent,
    ip_address,
    location,
    device_type,
    browser_name,
    is_current,
    expires_at
  )
  VALUES (
    p_user_id,
    p_session_token,
    p_user_agent,
    p_ip_address,
    p_location,
    p_device_type,
    p_browser_name,
    true,
    COALESCE(p_expires_at, NOW() + INTERVAL '30 days')
  )
  ON CONFLICT (session_token) 
  DO UPDATE SET
    last_activity = NOW(),
    is_current = true,
    user_agent = COALESCE(EXCLUDED.user_agent, user_sessions.user_agent),
    ip_address = COALESCE(EXCLUDED.ip_address, user_sessions.ip_address),
    location = COALESCE(EXCLUDED.location, user_sessions.location),
    device_type = COALESCE(EXCLUDED.device_type, user_sessions.device_type),
    browser_name = COALESCE(EXCLUDED.browser_name, user_sessions.browser_name)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to terminate a specific session
CREATE OR REPLACE FUNCTION terminate_user_session(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_exists BOOLEAN;
BEGIN
  -- Check if session exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM user_sessions 
    WHERE id = p_session_id AND user_id = p_user_id
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RETURN false;
  END IF;
  
  -- Delete the session
  DELETE FROM user_sessions 
  WHERE id = p_session_id AND user_id = p_user_id;
  
  -- Log the activity
  PERFORM log_security_activity(
    p_user_id,
    'session_terminated',
    true,
    NULL,
    NULL,
    jsonb_build_object('session_id', p_session_id)
  );
  
  RETURN true;
END;
$$;

-- Function to terminate all other sessions except current
CREATE OR REPLACE FUNCTION terminate_all_other_sessions(
  p_user_id UUID,
  p_current_session_token TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  terminated_count INTEGER;
BEGIN
  -- Delete all sessions except the current one
  DELETE FROM user_sessions 
  WHERE user_id = p_user_id 
    AND (p_current_session_token IS NULL OR session_token != p_current_session_token);
  
  GET DIAGNOSTICS terminated_count = ROW_COUNT;
  
  -- Log the activity
  PERFORM log_security_activity(
    p_user_id,
    'all_sessions_terminated',
    true,
    NULL,
    NULL,
    jsonb_build_object('terminated_count', terminated_count)
  );
  
  RETURN terminated_count;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions 
  SET last_activity = NOW() 
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON security_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_activity TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_all_other_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO service_role;
