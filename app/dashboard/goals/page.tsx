import { createServerClient } from "@/lib/supabase-server"
import { GoalsList } from "@/components/goals/goals-list"
import { GoalsHeader } from "@/components/goals/goals-header"

// Force dynamic rendering since this page uses server-side authentication
export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <div>Failed to initialize database connection.</div>
  }

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <GoalsHeader />
      <GoalsList goals={goals || []} />
    </div>
  )
}
