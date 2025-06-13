import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface GoalProgressProps {
  goals: any[]
}

export function GoalProgress({ goals }: GoalProgressProps) {
  const totalGoals = goals.length
  const completedGoals = goals.filter((goal) => goal.status === "Completed").length
  const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Goal Progress</CardTitle>
        <CardDescription>Your development goal completion rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Overall Progress</div>
              <div className="text-sm text-muted-foreground">{progressPercentage}%</div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Goals Breakdown</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <span>{completedGoals}</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <span>{goals.filter((goal) => goal.status === "In Progress").length}</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-muted-foreground">Not Started</span>
                </div>
                <span>{goals.filter((goal) => goal.status === "Not Started").length}</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <span className="text-muted-foreground">Stalled</span>
                </div>
                <span>{goals.filter((goal) => goal.status === "Stalled").length}</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
