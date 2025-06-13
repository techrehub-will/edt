import { createServerClient } from "@/lib/supabase-server"
import { GoalsList } from "@/components/goals/goals-list"
import { GoalsHeader } from "@/components/goals/goals-header"

export default async function GoalsPage() {
  const supabase = createServerClient()

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
