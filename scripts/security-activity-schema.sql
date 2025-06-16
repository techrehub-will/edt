-- Security Activity Tracking Schema
-- This table tracks security-related activities for user accounts

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

-- Create RLS policies
CREATE POLICY "Users can view their own security activity" ON security_activity
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security activity" ON security_activity
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a function to automatically log certain activities
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

-- Create a function to clean up old security activity (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_activity()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_activity 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON security_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_security_activity TO service_role;

-- Add trigger to automatically log password changes
CREATE OR REPLACE FUNCTION trigger_log_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if encrypted_password actually changed
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    PERFORM log_security_activity(
      NEW.id,
      'password_change',
      true,
      NULL,
      NULL,
      jsonb_build_object('timestamp', NOW())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for password changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_password_change'
  ) THEN
    CREATE TRIGGER on_password_change
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION trigger_log_password_change();
  END IF;
END;
$$;
