-- Enhanced Project Management Schema Migration
-- Run this script in your Supabase SQL editor to apply the improvements

-- 1. Add new columns to improvement_projects table
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS priority VARCHAR
(20) DEFAULT 'Medium';
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS start_date DATE;
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS target_completion_date DATE;
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS budget_estimated DECIMAL
(10,2);
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS budget_actual DECIMAL
(10,2);
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS assigned_to TEXT[];
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS dependencies TEXT[];
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS risks TEXT[];
ALTER TABLE improvement_projects ADD COLUMN
IF NOT EXISTS success_criteria TEXT[];

-- 2. Create project milestones table
CREATE TABLE
IF NOT EXISTS project_milestones
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
  project_id UUID NOT NULL REFERENCES improvement_projects
(id) ON
DELETE CASCADE,
  title VARCHAR(255)
NOT NULL,
  description TEXT,
  target_date DATE,
  completion_date DATE,
  status VARCHAR
(50) DEFAULT 'pending',
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 3. Create project tasks table
CREATE TABLE
IF NOT EXISTS project_tasks
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
  project_id UUID NOT NULL REFERENCES improvement_projects
(id) ON
DELETE CASCADE,
  milestone_id UUID
REFERENCES project_milestones
(id) ON
DELETE
SET NULL
,
  title VARCHAR
(255) NOT NULL,
  description TEXT,
  status VARCHAR
(50) DEFAULT 'todo',
  priority VARCHAR
(20) DEFAULT 'Medium',
  assigned_to UUID,
  due_date DATE,
  completion_date DATE,
  estimated_hours DECIMAL
(5,2),
  actual_hours DECIMAL
(5,2),
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 4. Create project updates/notes table
CREATE TABLE
IF NOT EXISTS project_updates
(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
  project_id UUID NOT NULL REFERENCES improvement_projects
(id) ON
DELETE CASCADE,
  user_id UUID
NOT NULL,
  update_type VARCHAR
(50) DEFAULT 'note',
  title VARCHAR
(255),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- 5. Add indexes for performance
CREATE INDEX
IF NOT EXISTS idx_project_milestones_project_id ON project_milestones
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_milestones_status ON project_milestones
(status);
CREATE INDEX
IF NOT EXISTS idx_project_tasks_project_id ON project_tasks
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_tasks_milestone_id ON project_tasks
(milestone_id);
CREATE INDEX
IF NOT EXISTS idx_project_tasks_status ON project_tasks
(status);
CREATE INDEX
IF NOT EXISTS idx_project_updates_project_id ON project_updates
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_updates_user_id ON project_updates
(user_id);

-- 6. Enable Row Level Security
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY
IF NOT EXISTS project_milestones_user_policy ON project_milestones
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_milestones.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);

CREATE POLICY
IF NOT EXISTS project_tasks_user_policy ON project_tasks
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_tasks.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);

CREATE POLICY
IF NOT EXISTS project_updates_user_policy ON project_updates
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_updates.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);

-- 8. Create functions for automatic progress calculation
CREATE OR REPLACE FUNCTION calculate_project_progress
(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress_percentage INTEGER;
BEGIN
    -- Count total tasks for the project
    SELECT COUNT(*)
    INTO total_tasks
    FROM project_tasks
    WHERE project_id = project_uuid;

    -- Count completed tasks
    SELECT COUNT(*)
    INTO completed_tasks
    FROM project_tasks
    WHERE project_id = project_uuid AND status = 'completed';

    -- Calculate percentage
    IF total_tasks = 0 THEN
    progress_percentage := 0;
ELSE
    progress_percentage := ROUND
((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
END
IF;
  
  -- Update the project
  UPDATE improvement_projects 
  SET progress_percentage = calculate_project_progress.progress_percentage
  WHERE id = project_uuid;

RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to automatically update project progress when tasks change
CREATE OR REPLACE FUNCTION update_project_progress_trigger
()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_project_progress
(COALESCE
(NEW.project_id, OLD.project_id));
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER
IF NOT EXISTS project_tasks_progress_trigger
  AFTER
INSERT OR
UPDATE OR DELETE ON project_tasks
  FOR EACH ROW
EXECUTE FUNCTION update_project_progress_trigger
();

-- 10. Update existing projects with default values
UPDATE improvement_projects 
SET priority = 'Medium' 
WHERE priority IS NULL;

UPDATE improvement_projects 
SET progress_percentage = 0 
WHERE progress_percentage IS NULL;

-- Migration completed successfully!
-- You can now use the enhanced project management features.
