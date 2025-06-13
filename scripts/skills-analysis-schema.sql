-- Create skills_analysis table to store AI-generated skills and suggestions
CREATE TABLE IF NOT EXISTS skills_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_type VARCHAR(50) NOT NULL,
  date_range VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  skills JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  data_summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_analysis_user_id ON skills_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_analysis_date ON skills_analysis(analysis_date);

-- Add RLS policy
ALTER TABLE skills_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY skills_analysis_user_policy ON skills_analysis
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
