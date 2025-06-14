-- Fix timeline constraint to make it nullable for future compatibility
-- This script makes the timeline field nullable so we can optionally remove it later

-- Make timeline nullable (PostgreSQL syntax)
ALTER TABLE improvement_projects ALTER COLUMN timeline DROP NOT NULL;

-- Add a comment explaining the timeline field
COMMENT ON COLUMN improvement_projects.timeline IS 'Legacy timeline field - consider using start_date and target_completion_date instead';
