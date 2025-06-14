-- Enhanced Project Management Schema
-- Add new columns to improvement_projects table

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

-- Create project milestones table
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

-- Create project tasks table
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

-- Create project updates/notes table
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

-- Add indexes
CREATE INDEX
IF NOT EXISTS idx_project_milestones_project_id ON project_milestones
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_tasks_project_id ON project_tasks
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_updates_project_id ON project_updates
(project_id);

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY project_milestones_user_policy ON project_milestones
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_milestones.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);

CREATE POLICY project_tasks_user_policy ON project_tasks
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_tasks.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);

CREATE POLICY project_updates_user_policy ON project_updates
  USING
(EXISTS
(
    SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_updates.project_id
    AND improvement_projects.user_id = auth.uid()
  )
);
