-- Fix project_tasks assigned_to field to support names instead of UUIDs

-- First, let's alter the assigned_to column to accept text instead of UUID
ALTER TABLE project_tasks ALTER COLUMN assigned_to TYPE
TEXT;

-- Update any existing NULL values
UPDATE project_tasks SET assigned_to = NULL WHERE assigned_to = '';

-- Add a comment to clarify the field purpose
COMMENT ON COLUMN project_tasks.assigned_to IS 'Name of the person assigned to this task (stored as text)';

-- Also fix milestone description field to allow longer text
ALTER TABLE project_milestones ALTER COLUMN description TYPE
TEXT;

-- Add any missing columns that might be expected
ALTER TABLE project_tasks ADD COLUMN
IF NOT EXISTS milestone_id UUID REFERENCES project_milestones
(id) ON
DELETE
SET NULL;

-- Make sure the RLS policies are correctly set up
DROP POLICY
IF EXISTS project_tasks_user_policy ON project_tasks;
CREATE POLICY project_tasks_user_policy ON project_tasks
  USING
(
    EXISTS
(
      SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_tasks.project_id
    AND improvement_projects.user_id = auth.uid()
    )
)
  WITH CHECK
(
    EXISTS
(
      SELECT 1
FROM improvement_projects
WHERE improvement_projects.id = project_tasks.project_id
    AND improvement_projects.user_id = auth.uid()
    )
);
