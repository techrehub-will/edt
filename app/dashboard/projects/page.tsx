import { createServerClient } from "@/lib/supabase-server"
import { ProjectsList } from "@/components/projects/projects-list"
import { ProjectsHeader } from "@/components/projects/projects-header"

export default async function ProjectsPage() {
  const supabase = createServerClient()

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all projects
  const { data: projects } = await supabase
    .from("improvement_projects")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <ProjectsHeader />
      <ProjectsList projects={projects || []} />
    </div>
  )
}
