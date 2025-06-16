-- Function to delete all user data when they delete their account
-- This function will be called before the user account is deleted
CREATE OR REPLACE FUNCTION delete_user_data(user_id_to_delete UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete user attachments first (due to foreign key constraints)
    DELETE FROM project_attachments 
    WHERE project_id IN (
        SELECT id FROM improvement_projects WHERE user_id = user_id_to_delete
    );

    -- Delete project updates
    DELETE FROM project_updates WHERE user_id = user_id_to_delete;

    -- Delete project tasks
    DELETE FROM project_tasks 
    WHERE project_id IN (
        SELECT id FROM improvement_projects WHERE user_id = user_id_to_delete
    );

    -- Delete project milestones
    DELETE FROM project_milestones 
    WHERE project_id IN (
        SELECT id FROM improvement_projects WHERE user_id = user_id_to_delete
    );

    -- Delete improvement projects
    DELETE FROM improvement_projects WHERE user_id = user_id_to_delete;

    -- Delete user settings
    DELETE FROM user_settings WHERE user_id = user_id_to_delete;

    -- Delete user profiles
    DELETE FROM user_profiles WHERE user_id = user_id_to_delete;

    -- Delete any analytics data if it exists
    -- Note: Add more tables as needed based on your schema
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
