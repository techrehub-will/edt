"use client"

import { useState, useMemo } from "react"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Target, CheckCircle, Download, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GanttItem {
  id: string
  title: string
  start_date: string
  end_date?: string
  status: string
  type: 'milestone' | 'task'
  progress?: number
}

interface ProjectGanttChartProps {
  project: any
  milestones: any[]
  tasks: any[]
}

export function ProjectGanttChart({ project, milestones, tasks }: ProjectGanttChartProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  // Export timeline as PDF
  const handleExportToPdf = async () => {
    setExporting(true)
    try {
      const jsPDF = (await import("jspdf")).default
      
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text(project.title + " - Timeline", 20, 20)
      
      // Project info
      doc.setFontSize(12)
      doc.text("System: " + project.system, 20, 35)
      doc.text("Generated: " + format(new Date(), "PPP"), 20, 45)
      
      // Timeline data
      let yPosition = 65
      
      // Combined timeline with sorted items
      if (ganttItems.length > 0) {
        doc.setFontSize(16)
        doc.text("Timeline Items", 20, yPosition)
        yPosition += 15
        
        doc.setFontSize(10)
        ganttItems.forEach((item, index) => {
          if (yPosition > 280) { // Create new page if needed
            doc.addPage()
            yPosition = 20
          }
          
          const type = item.type === 'milestone' ? 'MILESTONE' : 'TASK'
          const status = item.status.replace("_", " ").toUpperCase()
          const startDate = format(parseISO(item.start_date), "MMM dd, yyyy")
          const endDate = item.end_date ? format(parseISO(item.end_date), "MMM dd, yyyy") : "Ongoing"
          
          doc.text(`${index + 1}. [${type}] ${item.title}`, 25, yPosition)
          yPosition += 7
          doc.text(`   Status: ${status} | Start: ${startDate} | End: ${endDate}`, 25, yPosition)
          if (item.progress !== undefined) {
            yPosition += 7
            doc.text(`   Progress: ${item.progress}%`, 25, yPosition)
          }
          yPosition += 12
        })
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 20, 290)
      }
      
      doc.save(`${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_gantt_chart.pdf`)

      toast({
        title: "Success",
        description: "Gantt chart exported to PDF successfully.",
      })
    } catch (error) {
      console.error("Error exporting Gantt chart:", error)
      toast({
        title: "Error",
        description: "Failed to export Gantt chart.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  // Export timeline data as CSV
  const handleExportToCsv = () => {
    try {
      const headers = ['Type', 'Title', 'Status', 'Start Date', 'End Date', 'Progress']
      const csvContent = [
        headers.join(','),
        ...ganttItems.map(item => [
          item.type,
          `"${item.title}"`,
          item.status,
          item.start_date,
          item.end_date || '',
          item.progress || ''
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_timeline.csv`
      link.click()

      toast({
        title: "Success",
        description: "Timeline data exported to CSV successfully.",
      })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export CSV.",
        variant: "destructive",
      })
    }
  }
    // Combine milestones and tasks into gantt items
  const ganttItems: GanttItem[] = useMemo(() => {
    const items: GanttItem[] = []
    
    // Add milestones
    milestones.forEach(milestone => {
      items.push({
        id: milestone.id,
        title: milestone.title,
        start_date: milestone.target_date,
        end_date: milestone.completion_date || milestone.target_date,
        status: milestone.status,
        type: 'milestone'
      })
    })
    
    // Add tasks
    tasks.forEach(task => {
      // Use due_date as the main date, fallback to created_at
      const startDate = task.due_date || task.created_at
      // If task is completed, show completion_date, otherwise show due_date
      const endDate = task.completion_date || task.due_date || task.created_at
      
      items.push({
        id: task.id,
        title: task.title,
        start_date: startDate,
        end_date: endDate,
        status: task.status,
        type: 'task',
        progress: task.progress_percentage || 0
      })
    })
    
    // Filter out items without valid dates and sort by start date
    return items
      .filter(item => item.start_date)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [milestones, tasks])
    // Calculate date range for the gantt chart based on view mode
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // Sunday
  const monthStart = startOfMonth(currentWeek)
  const monthEnd = endOfMonth(currentWeek)
  
  const displayStart = viewMode === 'week' ? weekStart : monthStart
  const displayEnd = viewMode === 'week' ? weekEnd : monthEnd
  const daysInPeriod = eachDayOfInterval({ start: displayStart, end: displayEnd })
  
  // Navigation functions for both week and month
  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentWeek(prev => addDays(prev, -7))
    } else {
      setCurrentWeek(prev => addMonths(prev, -1))
    }
  }
  
  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentWeek(prev => addDays(prev, 7))
    } else {
      setCurrentWeek(prev => addMonths(prev, 1))
    }
  }
  
  const goToToday = () => {
    setCurrentWeek(new Date())
  }
    // Get status color
  const getStatusColor = (status: string, type: 'milestone' | 'task') => {
    const baseClasses = type === 'milestone' ? 'border-l-4' : 'border-l-2'
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return `${baseClasses} border-green-500 bg-green-50 text-green-700`
      case 'in_progress':
      case 'in-progress':
      case 'in progress':
        return `${baseClasses} border-blue-500 bg-blue-50 text-blue-700`
      case 'pending':
      case 'todo':
      case 'not started':
        return `${baseClasses} border-yellow-500 bg-yellow-50 text-yellow-700`
      case 'cancelled':
      case 'canceled':
      case 'blocked':
        return `${baseClasses} border-red-500 bg-red-50 text-red-700`
      case 'on hold':
      case 'paused':
        return `${baseClasses} border-orange-500 bg-orange-50 text-orange-700`
      default:
        return `${baseClasses} border-gray-500 bg-gray-50 text-gray-700`
    }
  }
  
  // Calculate item position and width on timeline
  const getItemPosition = (item: GanttItem) => {
    const startDate = parseISO(item.start_date)
    const endDate = parseISO(item.end_date || item.start_date)
    
    let position = 0
    let width = 0
    
    daysInPeriod.forEach((day, index) => {
      if (isSameDay(day, startDate)) {
        position = index
      }
      if (isWithinInterval(day, { start: startDate, end: endDate }) || isSameDay(day, startDate)) {
        if (position <= index) {
          width = Math.max(width, index - position + 1)
        }
      }
    })
    
    return { position, width: Math.max(width, 1) }
  }
  
  // Check if item is visible in current week
  const isItemVisible = (item: GanttItem) => {
    const startDate = parseISO(item.start_date)
    const endDate = parseISO(item.end_date || item.start_date)
    
    return daysInPeriod.some(day => 
      isWithinInterval(day, { start: startDate, end: endDate }) ||
      isSameDay(day, startDate) ||
      isSameDay(day, endDate)
    )
  }
  
  const visibleItems = ganttItems.filter(isItemVisible)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Project Timeline</CardTitle>
          </div>          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting}>
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportToPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportToCsv}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-4 border-l"></div>
            <div className="flex items-center gap-1 border rounded p-1">
              <Button 
                variant={viewMode === 'week' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
            </div>
            <div className="h-4 border-l"></div>            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>        
        <p className="text-sm text-muted-foreground">
          {viewMode === 'week' 
            ? `Week of ${format(displayStart, 'MMM d')} - ${format(displayEnd, 'MMM d, yyyy')}`
            : `${format(displayStart, 'MMMM yyyy')}`
          } • 
          {ganttItems.length} total items ({milestones.length} milestones, {tasks.length} tasks)
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">          {/* Timeline Header */}
          <div className="flex gap-1 overflow-x-auto">
            <div className="text-sm font-medium text-muted-foreground min-w-[200px] flex-shrink-0">
              Item
            </div>
            <div className="flex gap-1 min-w-0">
              {daysInPeriod.map((day, index) => (
                <div key={index} className="text-center min-w-[80px] flex-shrink-0">
                  <div className="text-xs font-medium text-muted-foreground">
                    {viewMode === 'week' ? format(day, 'EEE') : format(day, 'd')}
                  </div>
                  <div className={`text-sm ${isSameDay(day, new Date()) ? 'font-bold text-primary' : ''}`}>
                    {viewMode === 'week' ? format(day, 'd') : format(day, 'dd')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Timeline Items */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {visibleItems.length === 0 ? (                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items scheduled for this {viewMode}</p>
                  <p className="text-sm">Navigate to different {viewMode}s to view other timeline items</p>
                </div>
              ) : (                visibleItems.map((item) => {
                  return (
                    <div key={item.id} className="flex gap-1 items-center min-h-[40px] overflow-x-auto">
                      {/* Item Info */}
                      <div className="flex items-center gap-2 pr-2 min-w-[200px] flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {item.type === 'milestone' ? (
                            <Target className="h-3 w-3 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      
                      {/* Timeline Bar */}
                      <div className="flex gap-1 min-w-0">
                        {daysInPeriod.map((day, index) => {
                          const itemStart = parseISO(item.start_date)
                          const itemEnd = item.end_date ? parseISO(item.end_date) : itemStart
                          const isInRange = isWithinInterval(day, { start: itemStart, end: itemEnd })
                          const isStart = isSameDay(day, itemStart)
                          
                          return (
                            <div key={index} className="min-w-[80px] h-6 relative flex-shrink-0">
                              {isInRange && (
                                <div
                                  className={`absolute inset-0 rounded px-1 flex items-center justify-center ${getStatusColor(item.status, item.type)}`}
                                >
                                  {isStart && (
                                    <span className="text-xs font-medium truncate" title={item.title}>
                                      {viewMode === 'month' ? item.title.substring(0, 10) + (item.title.length > 10 ? '...' : '') : item.title}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
          
          {/* Legend */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-orange-500" />
                <span>Milestone</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>Task</span>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
