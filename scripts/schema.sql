-- Create tables for the Engineering Development Tracker

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  deadline TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical logs table
CREATE TABLE IF NOT EXISTS technical_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  system VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  resolution TEXT NOT NULL,
  outcome TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Improvement projects table
CREATE TABLE IF NOT EXISTS improvement_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  system VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  contractor_involved BOOLEAN DEFAULT FALSE,
  results TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_technical_logs_user_id ON technical_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_improvement_projects_user_id ON improvement_projects(user_id);

-- Add RLS policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY goals_user_policy ON goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY technical_logs_user_policy ON technical_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY improvement_projects_user_policy ON improvement_projects
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
