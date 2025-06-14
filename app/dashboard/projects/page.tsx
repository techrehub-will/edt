import { createServerClient } from "@/lib/supabase-server"
import { ProjectsDashboard } from "@/components/projects/projects-dashboard"

export default async function ProjectsPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <div>Error: Unable to connect to database</div>
  }

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Error: User not authenticated</div>
  }

  // Fetch all projects with enhanced data
  const { data: projects } = await supabase
    .from("improvement_projects")
    .select(`
      *,
      project_milestones (
        id,
        title,
        description,
        target_date,
        completion_date,
        status
      ),
      project_tasks (
        id,
        title,
        status,
        priority,
        due_date,
        completion_date
      ),
      project_updates (
        id,
        update_type,
        title,
        content,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <ProjectsDashboard projects={projects || []} />
}
