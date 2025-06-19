"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Target,
  MessageSquare
} from "lucide-react"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { ProjectAttachments } from "./project-attachments"
import { ProjectGanttChart } from "./project-gantt-chart"

interface ProjectDetailsProps {
  project: any
  onUpdate: (updates: any) => void
}

interface Milestone {
  id: string
  title: string
  description: string
  target_date: string
  completion_date?: string
  status: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assigned_to?: string
  due_date?: string
  completion_date?: string
  estimated_hours?: number
  actual_hours?: number
  milestone_id?: string
}

interface ProjectUpdate {
  id: string
  update_type: string
  title: string
  content: string
  created_at: string
}

interface ProjectAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  description?: string
  uploaded_at: string
}

export function ProjectDetails({ project, onUpdate }: ProjectDetailsProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(project.project_milestones || [])
  const [tasks, setTasks] = useState<Task[]>(project.project_tasks || [])
  const [updates, setUpdates] = useState<ProjectUpdate[]>(project.project_updates || [])
  const [attachments, setAttachments] = useState<ProjectAttachment[]>(project.project_attachments || [])
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isAddingUpdate, setIsAddingUpdate] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleAddMilestone = async (milestoneData: Partial<Milestone>) => {
    try {
      const { data, error } = await supabase
        .from("project_milestones")
        .insert({
          project_id: project.id,
          ...milestoneData
        })
        .select()
        .single()

      if (error) throw error

      setMilestones([...milestones, data])
      setIsAddingMilestone(false)
      toast({
        title: "Milestone added",
        description: "New milestone has been created successfully.",
      })
    } catch (error) {
      console.error("Error adding milestone:", error)
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          project_id: project.id,
          ...taskData
        })
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setIsAddingTask(false)
      toast({
        title: "Task added",
        description: "New task has been created successfully.",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddUpdate = async (updateData: Partial<ProjectUpdate>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("project_updates")
        .insert({
          project_id: project.id,
          user_id: user?.id,
          ...updateData
        })
        .select()
        .single()

      if (error) throw error

      setUpdates([data, ...updates])
      setIsAddingUpdate(false)
      toast({
        title: "Update added",
        description: "Project update has been posted successfully.",
      })
    } catch (error) {
      console.error("Error adding update:", error)
      toast({
        title: "Error",
        description: "Failed to add update. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("project_tasks")
        .update({ status: newStatus })
        .eq("id", taskId)

      if (error) throw error

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ))

      // Update project progress based on completed tasks
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
      const completedTasks = updatedTasks.filter(task => task.status === "completed").length
      const progressPercentage = Math.round((completedTasks / updatedTasks.length) * 100)

      onUpdate({ progress_percentage: progressPercentage })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">{project.objective}</CardDescription>
            </div>
            <Badge variant="outline" className="ml-4">
              {project.system}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(project.status)}
                <span className="font-medium">{project.status}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Priority</div>
              <Badge className={`mt-1 ${getPriorityColor(project.priority)}`}>
                {project.priority || "Medium"}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{project.progress_percentage || 0}%</span>
                </div>
                <Progress value={project.progress_percentage || 0} className="w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Tabs for different sections */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="gantt">Timeline</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Milestones</h3>
            <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Milestone</DialogTitle>
                </DialogHeader>
                <MilestoneForm onSubmit={handleAddMilestone} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(milestone.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                        {milestone.target_date && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Due: {format(new Date(milestone.target_date), "MMM dd, yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {milestone.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {milestones.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No milestones yet. Add your first milestone to track progress.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <TaskForm onSubmit={handleAddTask} milestones={milestones} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => updateTaskStatus(
                          task.id,
                          task.status === "completed" ? "todo" : "completed"
                        )}
                        className="mt-1"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{format(new Date(task.due_date), "MMM dd")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks yet. Break down your project into manageable tasks.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Updates</h3>
            <Dialog open={isAddingUpdate} onOpenChange={setIsAddingUpdate}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Project Update</DialogTitle>
                </DialogHeader>
                <UpdateForm onSubmit={handleAddUpdate} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {updates.map((update) => (
              <Card key={update.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{update.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {update.update_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {update.content}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(update.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {updates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No updates yet. Share progress and notes about this project.</p>
              </div>
            )}
          </div>        </TabsContent>

        <TabsContent value="gantt" className="space-y-4">
          <ProjectGanttChart
            project={project}
            milestones={milestones}
            tasks={tasks}
          />
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <ProjectAttachments
            projectId={project.id}
            attachments={attachments}
            onAttachmentsUpdate={setAttachments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MilestoneForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetDate, setTargetDate] = useState<Date>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      target_date: targetDate?.toISOString().split('T')[0],
      status: "pending"
    })
    setTitle("")
    setDescription("")
    setTargetDate(undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label>Target Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {targetDate ? format(targetDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={targetDate}
              onSelect={setTargetDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" className="w-full">Add Milestone</Button>
    </form>
  )
}

function TaskForm({ onSubmit, milestones }: { onSubmit: (data: any) => void, milestones: Milestone[] }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium")
  const [dueDate, setDueDate] = useState<Date>()
  const [milestoneId, setMilestoneId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      priority,
      due_date: dueDate?.toISOString().split('T')[0],
      milestone_id: milestoneId || null,
      status: "todo"
    })
    setTitle("")
    setDescription("")
    setPriority("Medium")
    setDueDate(undefined)
    setMilestoneId("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {milestones.length > 0 && (
        <div>
          <Label htmlFor="milestone">Milestone (Optional)</Label>
          <Select value={milestoneId} onValueChange={setMilestoneId}>
            <SelectTrigger>
              <SelectValue placeholder="Select milestone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No milestone</SelectItem>
              {milestones.map((milestone) => (
                <SelectItem key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full">Add Task</Button>
    </form>
  )
}

function UpdateForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [updateType, setUpdateType] = useState("note")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      content,
      update_type: updateType
    })
    setTitle("")
    setContent("")
    setUpdateType("note")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="updateType">Type</Label>
        <Select value={updateType} onValueChange={setUpdateType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="progress">Progress Update</SelectItem>
            <SelectItem value="issue">Issue/Risk</SelectItem>
            <SelectItem value="milestone">Milestone Achievement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />
      </div>
      <Button type="submit" className="w-full">Add Update</Button>
    </form>
  )
}
