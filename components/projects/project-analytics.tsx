"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts"
import { Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, Users, Target } from "lucide-react"

interface ProjectAnalyticsProps {
  projects: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ProjectAnalytics({ projects }: ProjectAnalyticsProps) {
  const analytics = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const priorityCounts = projects.reduce((acc, project) => {
      const priority = project.priority || 'Medium'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const systemCounts = projects.reduce((acc, project) => {
      acc[project.system] = (acc[project.system] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'Complete').length
    const ongoingProjects = projects.filter(p => p.status === 'ongoing' || p.status === 'Ongoing' || p.status === 'in-progress').length
    const plannedProjects = projects.filter(p => p.status === 'planned' || p.status === 'Planned' || p.status === 'planning').length
    const overdue = projects.filter(p => {
      if (!p.target_completion_date) return false
      return new Date(p.target_completion_date) < new Date() && p.status !== 'completed' && p.status !== 'Complete'
    }).length

    const averageProgress = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length 
      : 0

    const budgetUtilization = projects.reduce((acc, project) => {
      if (project.budget_estimated && project.budget_actual) {
        acc.estimated += project.budget_estimated
        acc.actual += project.budget_actual
      }
      return acc
    }, { estimated: 0, actual: 0 })

    return {
      statusCounts,
      priorityCounts,
      systemCounts,
      completedProjects,
      ongoingProjects,
      plannedProjects,
      overdue,
      averageProgress,
      budgetUtilization,
      totalProjects: projects.length
    }
  }, [projects])

  const statusData = Object.entries(analytics.statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const priorityData = Object.entries(analytics.priorityCounts).map(([name, value]) => ({
    name,
    value
  }))

  const systemData = Object.entries(analytics.systemCounts).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active project portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalProjects > 0 
                ? `${Math.round((analytics.completedProjects / analytics.totalProjects) * 100)}% completion rate`
                : 'No projects yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.ongoingProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Progress</CardTitle>
            <CardDescription>Overall project completion percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Portfolio Progress</span>
                <span className="text-sm font-medium">{Math.round(analytics.averageProgress)}%</span>
              </div>
              <Progress value={analytics.averageProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Estimated vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated</span>
                <span className="text-sm font-medium">${analytics.budgetUtilization.estimated.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actual</span>
                <span className="text-sm font-medium">${analytics.budgetUtilization.actual.toLocaleString()}</span>
              </div>
              {analytics.budgetUtilization.estimated > 0 && (
                <Progress 
                  value={(analytics.budgetUtilization.actual / analytics.budgetUtilization.estimated) * 100} 
                  className="w-full" 
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by System</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={systemData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Latest project updates and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    project.status === 'completed' || project.status === 'Complete' ? 'bg-green-500' :
                    project.status === 'ongoing' || project.status === 'Ongoing' || project.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">{project.system}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {project.priority || 'Medium'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {project.progress_percentage || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
