"use client"

import { useState, useMemo } from "react"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Target, CheckCircle } from "lucide-react"

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
  
  // Calculate date range for the gantt chart
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // Sunday
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7))
  }
  
  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7))
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
    
    daysInWeek.forEach((day, index) => {
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
    
    return daysInWeek.some(day => 
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
          </div>
            <div className="flex items-center gap-2">
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
            <div className="h-4 border-l"></div>
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>        
        <p className="text-sm text-muted-foreground">
          Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} • 
          {ganttItems.length} total items ({milestones.length} milestones, {tasks.length} tasks)
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-sm font-medium text-muted-foreground">
              Item
            </div>
            {daysInWeek.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-sm ${isSameDay(day, new Date()) ? 'font-bold text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Timeline Items */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {visibleItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items scheduled for this week</p>
                  <p className="text-sm">Navigate to different weeks to view other timeline items</p>
                </div>
              ) : (
                visibleItems.map((item) => {
                  const { position, width } = getItemPosition(item)
                  
                  return (
                    <div key={item.id} className="grid grid-cols-8 gap-1 items-center min-h-[40px]">
                      {/* Item Info */}
                      <div className="flex items-center gap-2 pr-2">
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
                      </div>
                      
                      {/* Timeline Bar */}
                      <div className="col-span-7 relative">
                        <div className="grid grid-cols-7 gap-1 h-6">
                          {Array.from({ length: 7 }, (_, index) => (
                            <div key={index} className="relative">                              {index >= position && index < position + width && (                                <div
                                  className={`absolute inset-0 rounded px-2 py-1 ${getStatusColor(item.status, item.type)} flex items-center justify-center`}
                                >
                                  {index === position && (
                                    <span className="text-xs font-medium truncate" title={item.title}>
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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
