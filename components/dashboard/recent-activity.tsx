import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { FileText, LightbulbIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentActivityProps {
  logs: any[]
  projects: any[]
}

export function RecentActivity({ logs, projects }: RecentActivityProps) {
  // Determine what to show based on availability
  let activities: any[] = []

  if (logs.length && projects.length) {
    activities = [
      ...logs.map((log) => ({
        ...log,
        type: "log",
        date: new Date(log.created_at),
      })),
      ...projects.map((project) => ({
        ...project,
        type: "project",
        date: new Date(project.created_at),
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  } else if (logs.length) {
    activities = logs
      .map((log) => ({
        ...log,
        type: "log",
        date: new Date(log.created_at),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  } else if (projects.length) {
    activities = projects
      .map((project) => ({
        ...project,
        type: "project",
        date: new Date(project.created_at),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  }

  const description =
    logs.length && projects.length
      ? "Your latest logs and projects"
      : logs.length
      ? "Your recent technical logs"
      : projects.length
      ? "Your recent projects"
      : "No recent activity"

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      activity.type === "log"
                        ? "bg-emerald-100 dark:bg-emerald-900/20"
                        : "bg-amber-100 dark:bg-amber-900/20"
                    }`}
                  >
                    {activity.type === "log" ? (
                      <FileText className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <LightbulbIcon className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Link
                      href={
                        activity.type === "log"
                          ? `/dashboard/technical-logs/${activity.id}`
                          : `/dashboard/projects/${activity.id}`
                      }
                      className="text-sm font-medium hover:text-primary hover:underline"
                    >
                      {activity.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.date, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
