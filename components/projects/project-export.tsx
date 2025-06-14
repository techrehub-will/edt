"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { Download, FileText, BarChart3, Table } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface ProjectExportProps {
  projects: any[]
}

interface ExportOptions {
  format: "pdf" | "csv" | "json"
  includeAnalytics: boolean
  includeTasks: boolean
  includeMilestones: boolean
  includeUpdates: boolean
  dateRange?: {
    from: Date
    to: Date
  }
  statusFilter: string[]
  priorityFilter: string[]
}

export function ProjectExport({ projects }: ProjectExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "pdf",
    includeAnalytics: true,
    includeTasks: true,
    includeMilestones: true,
    includeUpdates: true,
    statusFilter: [],
    priorityFilter: []
  })
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const filteredProjects = projects.filter(project => {
    const statusMatch = exportOptions.statusFilter.length === 0 || 
                       exportOptions.statusFilter.includes(project.status)
    const priorityMatch = exportOptions.priorityFilter.length === 0 || 
                         exportOptions.priorityFilter.includes(project.priority || "Medium")
    
    let dateMatch = true
    if (exportOptions.dateRange?.from && exportOptions.dateRange?.to) {
      const projectDate = new Date(project.created_at)
      dateMatch = projectDate >= exportOptions.dateRange.from && 
                 projectDate <= exportOptions.dateRange.to
    }

    return statusMatch && priorityMatch && dateMatch
  })

  const generateAnalytics = () => {
    const total = filteredProjects.length
    const completed = filteredProjects.filter(p => p.status === "completed" || p.status === "Complete").length
    const ongoing = filteredProjects.filter(p => p.status === "ongoing" || p.status === "Ongoing" || p.status === "in-progress").length
    const planned = filteredProjects.filter(p => p.status === "planned" || p.status === "Planned").length
    
    const overdue = filteredProjects.filter(p => {
      if (!p.target_completion_date) return false
      return new Date(p.target_completion_date) < new Date() && 
             p.status !== "completed" && p.status !== "Complete"
    }).length

    const avgProgress = total > 0 
      ? filteredProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / total 
      : 0

    const priorityBreakdown = filteredProjects.reduce((acc, p) => {
      const priority = p.priority || "Medium"
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const systemBreakdown = filteredProjects.reduce((acc, p) => {
      acc[p.system] = (acc[p.system] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      completed,
      ongoing,
      planned,
      overdue,
      avgProgress: Math.round(avgProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityBreakdown,
      systemBreakdown
    }
  }

  const exportToPDF = async () => {
    const doc = new jsPDF()
    const analytics = generateAnalytics()
    let yPosition = 20

    // Title
    doc.setFontSize(20)
    doc.text("Project Management Report", 20, yPosition)
    yPosition += 10

    // Date range
    doc.setFontSize(10)
    doc.text(`Generated on: ${format(new Date(), "PPP")}`, 20, yPosition)
    yPosition += 5
    
    if (exportOptions.dateRange?.from && exportOptions.dateRange?.to) {
      doc.text(
        `Period: ${format(exportOptions.dateRange.from, "MMM dd, yyyy")} - ${format(exportOptions.dateRange.to, "MMM dd, yyyy")}`, 
        20, 
        yPosition
      )
    }
    yPosition += 15

    // Analytics Section
    if (exportOptions.includeAnalytics) {
      doc.setFontSize(14)
      doc.text("Analytics Overview", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const analyticsText = [
        `Total Projects: ${analytics.total}`,
        `Completed: ${analytics.completed} (${analytics.completionRate}%)`,
        `In Progress: ${analytics.ongoing}`,
        `Planned: ${analytics.planned}`,
        `Overdue: ${analytics.overdue}`,
        `Average Progress: ${analytics.avgProgress}%`
      ]

      analyticsText.forEach((text) => {
        doc.text(text, 20, yPosition)
        yPosition += 6
      })
      yPosition += 10

      // Priority breakdown
      doc.text("Priority Breakdown:", 20, yPosition)
      yPosition += 6
      Object.entries(analytics.priorityBreakdown).forEach(([priority, count]) => {
        doc.text(`  ${priority}: ${count}`, 25, yPosition)
        yPosition += 5
      })
      yPosition += 10
    }

    // Projects Table
    const tableColumns = [
      "Title", "System", "Status", "Priority", "Progress", "Target Date"
    ]
    
    const tableRows = filteredProjects.map(project => [
      project.title,
      project.system,
      project.status,
      project.priority || "Medium",
      `${project.progress_percentage || 0}%`,
      project.target_completion_date 
        ? format(new Date(project.target_completion_date), "MMM dd, yyyy")
        : "Not set"
    ])

    ;(doc as any).autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Project Details
    for (const project of filteredProjects) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(12)
      doc.text(`Project: ${project.title}`, 20, yPosition)
      yPosition += 8

      doc.setFontSize(9)
      doc.text(`System: ${project.system}`, 20, yPosition)
      yPosition += 5
      doc.text(`Status: ${project.status}`, 20, yPosition)
      yPosition += 5
      doc.text(`Objective: ${project.objective}`, 20, yPosition)
      yPosition += 8

      // Tasks if included
      if (exportOptions.includeTasks && project.project_tasks?.length > 0) {
        doc.setFontSize(10)
        doc.text("Tasks:", 20, yPosition)
        yPosition += 5

        project.project_tasks.forEach((task: any) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.setFontSize(8)
          doc.text(`• ${task.title} (${task.status})`, 25, yPosition)
          yPosition += 4
        })
        yPosition += 5
      }

      // Milestones if included
      if (exportOptions.includeMilestones && project.project_milestones?.length > 0) {
        doc.setFontSize(10)
        doc.text("Milestones:", 20, yPosition)
        yPosition += 5

        project.project_milestones.forEach((milestone: any) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.setFontSize(8)
          doc.text(`• ${milestone.title} (${milestone.status})`, 25, yPosition)
          yPosition += 4
        })
        yPosition += 5
      }

      yPosition += 10
    }

    doc.save(`project-report-${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const exportToCSV = () => {
    const headers = [
      "ID", "Title", "System", "Status", "Priority", "Progress %", 
      "Created Date", "Target Completion", "Objective"
    ]

    if (exportOptions.includeTasks) {
      headers.push("Total Tasks", "Completed Tasks")
    }

    if (exportOptions.includeMilestones) {
      headers.push("Total Milestones", "Completed Milestones")
    }

    const rows = filteredProjects.map(project => {
      const row = [
        project.id,
        `"${project.title}"`,
        project.system,
        project.status,
        project.priority || "Medium",
        project.progress_percentage || 0,
        format(new Date(project.created_at), "yyyy-MM-dd"),
        project.target_completion_date || "",
        `"${project.objective}"`
      ]

      if (exportOptions.includeTasks) {
        const totalTasks = project.project_tasks?.length || 0
        const completedTasks = project.project_tasks?.filter((t: any) => t.status === "completed").length || 0
        row.push(totalTasks.toString(), completedTasks.toString())
      }

      if (exportOptions.includeMilestones) {
        const totalMilestones = project.project_milestones?.length || 0
        const completedMilestones = project.project_milestones?.filter((m: any) => m.status === "completed").length || 0
        row.push(totalMilestones.toString(), completedMilestones.toString())
      }

      return row
    })

    const csvContent = [headers, ...rows]
      .map(row => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `project-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalProjects: filteredProjects.length,
        filters: exportOptions,
        analytics: exportOptions.includeAnalytics ? generateAnalytics() : null
      },
      projects: filteredProjects.map(project => ({
        ...project,
        tasks: exportOptions.includeTasks ? project.project_tasks : undefined,
        milestones: exportOptions.includeMilestones ? project.project_milestones : undefined,
        updates: exportOptions.includeUpdates ? project.project_updates : undefined
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `project-export-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      switch (exportOptions.format) {
        case "pdf":
          await exportToPDF()
          break
        case "csv":
          exportToCSV()
          break
        case "json":
          exportToJSON()
          break
      }
      
      toast({
        title: "Export completed",
        description: `Projects exported successfully as ${exportOptions.format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "Failed to export projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)))
  const uniquePriorities = Array.from(new Set(projects.map(p => p.priority || "Medium")))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Projects
        </CardTitle>
        <CardDescription>
          Generate comprehensive reports and export project data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Export Format</Label>
          <div className="flex gap-2">
            <Button
              variant={exportOptions.format === "pdf" ? "default" : "outline"}
              size="sm"
              onClick={() => setExportOptions({ ...exportOptions, format: "pdf" })}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
            <Button
              variant={exportOptions.format === "csv" ? "default" : "outline"}
              size="sm"
              onClick={() => setExportOptions({ ...exportOptions, format: "csv" })}
            >
              <Table className="h-4 w-4 mr-2" />
              CSV Data
            </Button>
            <Button
              variant={exportOptions.format === "json" ? "default" : "outline"}
              size="sm"
              onClick={() => setExportOptions({ ...exportOptions, format: "json" })}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Include Options */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Include in Export</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="analytics"
                checked={exportOptions.includeAnalytics}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeAnalytics: !!checked })
                }
              />
              <Label htmlFor="analytics" className="text-sm">Analytics Overview</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tasks"
                checked={exportOptions.includeTasks}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeTasks: !!checked })
                }
              />
              <Label htmlFor="tasks" className="text-sm">Project Tasks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="milestones"
                checked={exportOptions.includeMilestones}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeMilestones: !!checked })
                }
              />
              <Label htmlFor="milestones" className="text-sm">Milestones</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updates"
                checked={exportOptions.includeUpdates}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, includeUpdates: !!checked })
                }
              />
              <Label htmlFor="updates" className="text-sm">Project Updates</Label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Status Filter</Label>
            <div className="space-y-2">
              {uniqueStatuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={exportOptions.statusFilter.includes(status)}
                    onCheckedChange={(checked) => {
                      const newFilter = checked
                        ? [...exportOptions.statusFilter, status]
                        : exportOptions.statusFilter.filter(s => s !== status)
                      setExportOptions({ ...exportOptions, statusFilter: newFilter })
                    }}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm">{status}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Priority Filter</Label>
            <div className="space-y-2">
              {uniquePriorities.map(priority => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={exportOptions.priorityFilter.includes(priority)}
                    onCheckedChange={(checked) => {
                      const newFilter = checked
                        ? [...exportOptions.priorityFilter, priority]
                        : exportOptions.priorityFilter.filter(p => p !== priority)
                      setExportOptions({ ...exportOptions, priorityFilter: newFilter })
                    }}
                  />
                  <Label htmlFor={`priority-${priority}`} className="text-sm">{priority}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Summary</p>
              <p className="text-sm text-muted-foreground">
                {filteredProjects.length} projects will be exported
              </p>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || filteredProjects.length === 0}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
