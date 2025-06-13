-- Add indexes to improve analytics query performance
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);

CREATE INDEX IF NOT EXISTS idx_technical_logs_system ON technical_logs(system);
CREATE INDEX IF NOT EXISTS idx_technical_logs_created_at ON technical_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_improvement_projects_system ON improvement_projects(system);
CREATE INDEX IF NOT EXISTS idx_improvement_projects_status ON improvement_projects(status);
CREATE INDEX IF NOT EXISTS idx_improvement_projects_created_at ON improvement_projects(created_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_user_system ON technical_logs(user_id, system);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON improvement_projects(user_id, status);
