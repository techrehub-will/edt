"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Target, FileText, Lightbulb, Award, Clock, Activity } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface AnalyticsData {
  goals: any[]
  logs: any[]
  projects: any[]
  skillsAnalyses: any[]
}

interface ChartData {
  name: string
  value: number
  color?: string
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export function AnalyticsDashboard() {
  const { supabase } = useSupabase()
  const [data, setData] = useState<AnalyticsData>({
    goals: [],
    logs: [],
    projects: [],
    skillsAnalyses: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")

  useEffect(() => {
    fetchAnalyticsData()
  }, [supabase, timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range
      let fromDate: Date
      switch (timeRange) {
        case "1month":
          fromDate = subMonths(new Date(), 1)
          break
        case "3months":
          fromDate = subMonths(new Date(), 3)
          break
        case "6months":
          fromDate = subMonths(new Date(), 6)
          break
        case "1year":
          fromDate = subMonths(new Date(), 12)
          break
        default:
          fromDate = subMonths(new Date(), 6)
      }

      // Fetch all data
      const [goalsResult, logsResult, projectsResult, skillsResult] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id).gte("created_at", fromDate.toISOString()),
        supabase.from("technical_logs").select("*").eq("user_id", user.id).gte("created_at", fromDate.toISOString()),
        supabase
          .from("improvement_projects")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", fromDate.toISOString()),
        supabase
          .from("skills_analysis")
          .select("*")
          .eq("user_id", user.id)
          .gte("analysis_date", fromDate.toISOString()),
      ])

      setData({
        goals: goalsResult.data || [],
        logs: logsResult.data || [],
        projects: projectsResult.data || [],
        skillsAnalyses: skillsResult.data || [],
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate key metrics
  const totalGoals = data.goals.length
  const completedGoals = data.goals.filter((g) => g.status === "Completed").length
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  const totalLogs = data.logs.length
  const totalProjects = data.projects.length
  const completedProjects = data.projects.filter((p) => p.status === "Complete").length

  // Prepare chart data
  const goalStatusData: ChartData[] = [
    { name: "Completed", value: data.goals.filter((g) => g.status === "Completed").length, color: COLORS[1] },
    { name: "In Progress", value: data.goals.filter((g) => g.status === "In Progress").length, color: COLORS[0] },
    { name: "Not Started", value: data.goals.filter((g) => g.status === "Not Started").length, color: COLORS[3] },
    { name: "Stalled", value: data.goals.filter((g) => g.status === "Stalled").length, color: COLORS[2] },
  ].filter((item) => item.value > 0)

  const systemsData: ChartData[] = [
    ...data.logs.reduce((acc: Map<string, number>, log) => {
      acc.set(log.system, (acc.get(log.system) || 0) + 1)
      return acc
    }, new Map()),
    ...data.projects.reduce((acc: Map<string, number>, project) => {
      acc.set(project.system, (acc.get(project.system) || 0) + 1)
      return acc
    }, new Map()),
  ].reduce((acc: Map<string, number>, [system, count]) => {
    acc.set(system, (acc.get(system) || 0) + count)
    return acc
  }, new Map())

  const systemsChartData = Array.from(systemsData.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Monthly activity data
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)

    const monthGoals = data.goals.filter((g) => {
      const created = new Date(g.created_at)
      return created >= monthStart && created <= monthEnd
    }).length

    const monthLogs = data.logs.filter((l) => {
      const created = new Date(l.created_at)
      return created >= monthStart && created <= monthEnd
    }).length

    const monthProjects = data.projects.filter((p) => {
      const created = new Date(p.created_at)
      return created >= monthStart && created <= monthEnd
    }).length

    monthlyData.push({
      month: format(date, "MMM yyyy"),
      goals: monthGoals,
      logs: monthLogs,
      projects: monthProjects,
      total: monthGoals + monthLogs + monthProjects,
    })
  }

  // Category distribution
  const categoryData = data.goals.reduce((acc: Map<string, number>, goal) => {
    acc.set(goal.category, (acc.get(goal.category) || 0) + 1)
    return acc
  }, new Map())

  const categoryChartData = Array.from(categoryData.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="1month">1M</TabsTrigger>
            <TabsTrigger value="3months">3M</TabsTrigger>
            <TabsTrigger value="6months">6M</TabsTrigger>
            <TabsTrigger value="1year">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalCompletionRate}%</div>
            <Progress value={goalCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedGoals} of {totalGoals} goals completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Issues Resolved</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">Issues documented and resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Projects</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">{completedProjects} completed projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Analyses</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.skillsAnalyses.length}</div>
            <p className="text-xs text-muted-foreground">AI-powered skill assessments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Over Time
            </CardTitle>
            <CardDescription>Your development activity by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goal Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Status Distribution
            </CardTitle>
            <CardDescription>Breakdown of your goal statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={goalStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {goalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Systems Worked On */}
        <Card>
          <CardHeader>
            <CardTitle>Systems & Technologies</CardTitle>
            <CardDescription>Most frequently worked on systems</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={systemsChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goal Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Categories</CardTitle>
            <CardDescription>Distribution of your development focus areas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity Summary
          </CardTitle>
          <CardDescription>Your latest development activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Target className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{goal.title}</p>
                  <p className="text-xs text-muted-foreground">{goal.category}</p>
                </div>
                <Badge variant="outline">{goal.status}</Badge>
              </div>
            ))}
            {data.logs.slice(0, 2).map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="h-4 w-4 text-emerald-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.title}</p>
                  <p className="text-xs text-muted-foreground">{log.system}</p>
                </div>
                <Badge variant="outline">Resolved</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
