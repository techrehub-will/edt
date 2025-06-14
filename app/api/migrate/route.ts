import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run the migration to fix the assigned_to field
    const migrationSQL = `
      -- Fix project_tasks assigned_to field to support names instead of UUIDs
      ALTER TABLE project_tasks ALTER COLUMN assigned_to TYPE TEXT;
      
      -- Update any existing NULL values
      UPDATE project_tasks SET assigned_to = NULL WHERE assigned_to = '';
      
      -- Add a comment to clarify the field purpose
      COMMENT ON COLUMN project_tasks.assigned_to IS 'Name of the person assigned to this task (stored as text)';
    `

    const { error: migrationError } = await supabase.rpc('execute_migration', {
      migration_sql: migrationSQL
    })

    if (migrationError) {
      // If the RPC doesn't exist, try to run the SQL directly
      // This is a fallback approach
      const { error: directError } = await supabase
        .from('project_tasks')
        .select('id')
        .limit(1)

      if (directError) {
        throw new Error(`Migration failed: ${migrationError.message}`)
      }

      // Since we can't run DDL directly, let's return a success message
      // The actual migration would need to be run manually in the Supabase dashboard
      return NextResponse.json({ 
        message: 'Migration script created. Please run the SQL in the Supabase dashboard.',
        sql: migrationSQL
      })
    }

    return NextResponse.json({ message: 'Migration completed successfully' })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
