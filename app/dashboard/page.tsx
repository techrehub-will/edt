import { createServerClient } from "@/lib/supabase-server"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardCards } from "@/components/dashboard/cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { GoalProgress } from "@/components/dashboard/goal-progress"

// Force dynamic rendering since this page uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <div>Failed to initialize database connection.</div>
  }

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    

  // Fetch recent logs
  const { data: logs } = await supabase
    .from("technical_logs")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
  

  // Fetch recent projects
  const { data: projects } = await supabase
    .from("improvement_projects")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardCards goals={goals || []} logs={logs || []} projects={projects || []} />
      <div className="grid gap-6 md:grid-cols-3">
        <GoalProgress goals={goals || []} />
        <RecentActivity logs={logs || []} projects={[]} />
        <RecentActivity logs={ []} projects={projects || []} />

      </div>
    </div>
  )
}
