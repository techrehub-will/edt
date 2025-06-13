-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prediction', 'trend', 'suggestion', 'pattern')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT NOT NULL,
  actionable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scada', 'cmms', 'plc', 'erp', 'historian')),
  status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'error', 'testing')),
  endpoint TEXT NOT NULL,
  api_key TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  data_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own integrations" ON integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own integration logs" ON integration_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration logs" ON integration_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_type ON ai_insights(type);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_status ON integrations(status);

CREATE INDEX idx_integration_logs_user_id ON integration_logs(user_id);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);

-- Insert some sample notifications for demo purposes
INSERT INTO notifications (user_id, title, message, type, priority, read, action_url) 
SELECT 
  auth.uid(),
  'Welcome to Engineering Development Tracker!',
  'Start by setting your first development goal or logging a technical issue.',
  'info',
  'medium',
  false,
  '/dashboard/goals'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, priority, read) 
SELECT 
  auth.uid(),
  'Goal Deadline Approaching',
  'Your PLC Programming certification goal is due in 3 days.',
  'warning',
  'high',
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, priority, read) 
SELECT 
  auth.uid(),
  'New Achievement Unlocked!',
  'You have completed 5 technical logs this month.',
  'success',
  'medium',
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
