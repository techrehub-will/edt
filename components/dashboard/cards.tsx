import Link from "next/link"
import { FileText, LightbulbIcon, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardsProps {
  goals: any[]
  logs: any[]
  projects: any[]
}

export function DashboardCards({ goals, logs, projects }: DashboardCardsProps) {
  const activeGoals = goals.filter((goal) => goal.status === "In Progress").length
  const completedGoals = goals.filter((goal) => goal.status === "Completed").length
  const totalLogs = logs.length
  const totalProjects = projects.length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Link href="/dashboard/goals" className="block">
        <Card className="card-hover border-l-4 border-l-blue-500 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development Goals</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals} Active</div>
            <p className="text-xs text-muted-foreground">{completedGoals} completed goals</p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/dashboard/technical-logs" className="block">
        <Card className="card-hover border-l-4 border-l-emerald-500 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Logs</CardTitle>
            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/20">
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">Total technical issues documented</p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/dashboard/projects" className="block">
        <Card className="card-hover border-l-4 border-l-amber-500 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Projects</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/20">
              <LightbulbIcon className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Total improvement initiatives</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
