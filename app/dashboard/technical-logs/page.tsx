import { createServerClient } from "@/lib/supabase-server"
import { LogsList } from "@/components/logs/logs-list"
import { LogsHeader } from "@/components/logs/logs-header"

export default async function LogsPage() {
  const supabase = createServerClient()

  // Fetch user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all logs
  const { data: logs } = await supabase
    .from("technical_logs")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <LogsHeader />
      <LogsList logs={logs || []} />
    </div>
  )
}
