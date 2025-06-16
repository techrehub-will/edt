-- Add project attachments table
CREATE TABLE
IF NOT EXISTS project_attachments
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES improvement_projects
(id) ON
DELETE CASCADE,
  user_id UUID
NOT NULL REFERENCES auth.users
(id) ON
DELETE CASCADE,
  file_name VARCHAR(255)
NOT NULL,
  file_path VARCHAR
(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR
(100) NOT NULL,
  uploaded_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  description TEXT,
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
()
);

-- Add RLS policies
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see attachments for their own projects
CREATE POLICY "Users can view their own project attachments" ON project_attachments
  FOR
SELECT USING (
    user_id = auth.uid() OR
    project_id IN (
      SELECT id
    FROM improvement_projects
    WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only insert attachments for their own projects  
CREATE POLICY "Users can insert attachments for their own projects" ON project_attachments
  FOR
INSERT WITH CHECK
  (
  user_id
= auth.uid
() AND
    project_id IN
(
      SELECT id
FROM improvement_projects
WHERE user_id = auth.uid()
    )
);

-- Policy: Users can only update their own attachments
CREATE POLICY "Users can update their own project attachments" ON project_attachments
  FOR
UPDATE USING (user_id = auth.uid()
);

-- Policy: Users can only delete their own attachments
CREATE POLICY "Users can delete their own project attachments" ON project_attachments
  FOR
DELETE USING (user_id
= auth.uid
());

-- Add indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_project_attachments_project_id ON project_attachments
(project_id);
CREATE INDEX
IF NOT EXISTS idx_project_attachments_user_id ON project_attachments
(user_id);
CREATE INDEX
IF NOT EXISTS idx_project_attachments_uploaded_at ON project_attachments
(uploaded_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_attachments_updated_at
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_project_attachments_updated_at
  BEFORE
UPDATE ON project_attachments
  FOR EACH ROW
EXECUTE FUNCTION update_project_attachments_updated_at
();
