"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Target, 
  Users, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  MessageSquare,
  Download,
  ExternalLink,
  Tag,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  X
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProjectAttachments } from "@/components/projects/project-attachments"
import { ProjectUpdates } from "@/components/projects/project-updates"

interface Project {
  id: string
  title: string
  objective: string
  system: string
  status: string
  timeline: string
  priority: string
  contractor_involved: boolean
  results: string
  images: string[]
  start_date: string
  target_completion_date: string
  actual_completion_date: string
  progress_percentage: number
  budget_estimated: number
  budget_actual: number
  assigned_to: string[]
  tags: string[]
  dependencies: string[]
  risks: string[]
  success_criteria: string[]
  created_at: string
  updated_at: string
}

interface Milestone {
  id: string
  title: string
  description: string
  target_date: string
  completion_date: string | null
  status: string
  created_at: string
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assigned_to: string | null
  due_date: string | null
  completion_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  created_at: string
}

interface ProjectUpdate {
  id: string
  project_id: string
  user_id: string
  update_type: string
  title?: string
  content: string
  attachments: string[]
  created_at: string
}

const statusColors = {
  "not_started": "bg-gray-500",
  "planning": "bg-blue-500",
  "in_progress": "bg-yellow-500",
  "on_hold": "bg-orange-500",
  "completed": "bg-green-500",
  "cancelled": "bg-red-500"
}

const priorityColors = {
  "Low": "bg-gray-500",
  "Medium": "bg-blue-500",
  "High": "bg-orange-500",
  "Critical": "bg-red-500"
}

export default function ProjectViewerPage() {  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, isConnected } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  
  // Add milestone/task dialog states
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    target_date: "",
    status: "pending"
  })
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "Medium",
    assigned_to: "",
    due_date: "",
    estimated_hours: 0
  })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadProjectData()
    }
  }, [params.id])

  const loadProjectData = async () => {
    try {
      setLoading(true)

      if (!isConnected) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view project details.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to view project details.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from("improvement_projects")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

      if (projectError) {
        console.error("Error loading project:", projectError)
        toast({
          title: "Error",
          description: "Failed to load project details.",
          variant: "destructive",
        })
        router.push("/dashboard/projects")
        return
      }

      if (!projectData) {
        toast({
          title: "Project Not Found",
          description: "The requested project could not be found.",
          variant: "destructive",
        })
        router.push("/dashboard/projects")
        return
      }

      setProject(projectData)

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", params.id)
        .order("target_date", { ascending: true })

      if (milestonesError) {
        console.error("Error loading milestones:", milestonesError)
      } else {
        setMilestones(milestonesData || [])
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })

      if (tasksError) {
        console.error("Error loading tasks:", tasksError)
      } else {
        setTasks(tasksData || [])
      }      // Load updates
      const { data: updatesData, error: updatesError } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })

      if (updatesError) {
        console.error("Error loading updates:", updatesError)
      } else {
        setUpdates(updatesData || [])
      }

      // Load attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("project_attachments")
        .select("*")
        .eq("project_id", params.id)
        .order("uploaded_at", { ascending: false })

      if (attachmentsError) {
        console.error("Error loading attachments:", attachmentsError)
      } else {
        setAttachments(attachmentsData || [])
      }

    } catch (error) {
      console.error("Error loading project data:", error)
      toast({
        title: "Error",
        description: "Failed to load project data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-500"
  }

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || "bg-gray-500"
  }
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  const calculateTimelineProgress = () => {
    if (!project?.start_date || !project?.target_completion_date) return 0
    
    const start = new Date(project.start_date)
    const target = new Date(project.target_completion_date)
    const now = new Date()
    
    const total = target.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === "completed").length
  }

  const getCompletedMilestones = () => {
    return milestones.filter(milestone => milestone.status === "completed").length
  }

  // Add milestone function
  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast({
        title: "Error",
        description: "Milestone title is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const milestoneData = {
        project_id: params.id,
        title: newMilestone.title,
        description: newMilestone.description,
        target_date: newMilestone.target_date || null,
        status: newMilestone.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("project_milestones")
        .insert(milestoneData)
        .select()
        .single()

      if (error) throw error

      setMilestones([...milestones, data])
      setNewMilestone({ title: "", description: "", target_date: "", status: "pending" })
      setAddMilestoneOpen(false)

      toast({
        title: "Success",
        description: "Milestone added successfully.",
      })
    } catch (error) {
      console.error("Error adding milestone:", error)
      toast({
        title: "Error",
        description: "Failed to add milestone.",
        variant: "destructive",
      })
    }
  }  // Add task function
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Prepare task data with proper null handling
      const taskData = {
        project_id: params.id,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        status: newTask.status,
        priority: newTask.priority,
        assigned_to: newTask.assigned_to.trim() || null, // Store as text now
        due_date: newTask.due_date || null,
        estimated_hours: newTask.estimated_hours > 0 ? newTask.estimated_hours : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Inserting task data:', taskData)

      const { data, error } = await supabase
        .from("project_tasks")
        .insert(taskData)
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        // If error is related to UUID constraint on assigned_to, try with null
        if (error.message.includes('uuid') || error.message.includes('assigned_to')) {
          console.log('Retrying with assigned_to as null due to UUID constraint')
          const retryTaskData = { ...taskData, assigned_to: null }
          
          const { data: retryData, error: retryError } = await supabase
            .from("project_tasks")
            .insert(retryTaskData)
            .select()
            .single()

          if (retryError) {
            throw retryError
          }

          // Store the assigned name in the local state for display
          const taskWithAssignedName = {
            ...retryData,
            assigned_to: newTask.assigned_to.trim() || null
          }

          setTasks([taskWithAssignedName, ...tasks])
        } else {
          throw error
        }
      } else {
        setTasks([data, ...tasks])
      }

      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "Medium",
        assigned_to: "",
        due_date: "",
        estimated_hours: 0
      })
      setAddTaskOpen(false)

      toast({
        title: "Success",
        description: "Task added successfully.",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: `Failed to add task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  // Update milestone status
  const handleUpdateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      const updateData = {
        status,
        completion_date: status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("project_milestones")
        .update(updateData)
        .eq("id", milestoneId)

      if (error) throw error

      setMilestones(milestones.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, ...updateData }
          : milestone
      ))

      toast({
        title: "Success",
        description: "Milestone status updated.",
      })
    } catch (error) {
      console.error("Error updating milestone:", error)
      toast({
        title: "Error",
        description: "Failed to update milestone.",
        variant: "destructive",
      })
    }
  }

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updateData = {
        status,
        completion_date: status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("project_tasks")
        .update(updateData)
        .eq("id", taskId)

      if (error) throw error

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updateData }
          : task
      ))

      toast({
        title: "Success",
        description: "Task status updated.",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      })
    }
  }

  // Delete milestone
  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from("project_milestones")
        .delete()
        .eq("id", milestoneId)

      if (error) throw error

      setMilestones(milestones.filter(milestone => milestone.id !== milestoneId))

      toast({
        title: "Success",
        description: "Milestone deleted.",
      })
    } catch (error) {
      console.error("Error deleting milestone:", error)
      toast({
        title: "Error",
        description: "Failed to delete milestone.",
        variant: "destructive",
      })
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskId)

      if (error) throw error

      setTasks(tasks.filter(task => task.id !== taskId))

      toast({
        title: "Success",
        description: "Task deleted.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      })
    }
  }

  // Export to DOCX
  const handleExportToDocx = async () => {
    if (!project) return

    setExporting(true)
    try {
      const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType } = await import("docx")

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: project.title,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              
              // Project Details Section
              new Paragraph({
                text: "Project Overview",
                heading: HeadingLevel.HEADING_1,
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "System: ", bold: true }),
                  new TextRun({ text: project.system }),
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Status: ", bold: true }),
                  new TextRun({ text: project.status.replace("_", " ").toUpperCase() }),
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Priority: ", bold: true }),
                  new TextRun({ text: project.priority }),
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Progress: ", bold: true }),
                  new TextRun({ text: `${project.progress_percentage}%` }),
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Timeline: ", bold: true }),
                  new TextRun({ text: project.timeline }),
                ],
              }),
              
              new Paragraph({ text: "" }), // Empty line
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Objective: ", bold: true }),
                ],
              }),
              
              new Paragraph({
                text: project.objective,
              }),
              
              new Paragraph({ text: "" }), // Empty line
              
              // Dates section
              new Paragraph({
                children: [
                  new TextRun({ text: "Start Date: ", bold: true }),
                  new TextRun({ text: formatDate(project.start_date) }),
                ],
              }),
              
              new Paragraph({
                children: [
                  new TextRun({ text: "Target Completion: ", bold: true }),
                  new TextRun({ text: formatDate(project.target_completion_date) }),
                ],
              }),
              
              ...(project.actual_completion_date ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Actual Completion: ", bold: true }),
                    new TextRun({ text: formatDate(project.actual_completion_date) }),
                  ],
                }),
              ] : []),
              
              new Paragraph({ text: "" }), // Empty line
              
              // Budget section
              ...(project.budget_estimated || project.budget_actual ? [
                new Paragraph({
                  text: "Budget Information",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                ...(project.budget_estimated ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Estimated Budget: ", bold: true }),
                      new TextRun({ text: `$${project.budget_estimated.toLocaleString()}` }),
                    ],
                  }),
                ] : []),
                
                ...(project.budget_actual ? [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Actual Budget: ", bold: true }),
                      new TextRun({ text: `$${project.budget_actual.toLocaleString()}` }),
                    ],
                  }),
                ] : []),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Team section
              ...(project.assigned_to && project.assigned_to.length > 0 ? [
                new Paragraph({
                  text: "Team Members",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                ...project.assigned_to.map(person => 
                  new Paragraph({
                    text: `• ${person}`,
                  })
                ),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Tags section
              ...(project.tags && project.tags.length > 0 ? [
                new Paragraph({
                  text: "Tags",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                new Paragraph({
                  text: project.tags.join(", "),
                }),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Success Criteria section
              ...(project.success_criteria && project.success_criteria.length > 0 ? [
                new Paragraph({
                  text: "Success Criteria",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                ...project.success_criteria.map(criteria => 
                  new Paragraph({
                    text: `• ${criteria}`,
                  })
                ),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Risks section
              ...(project.risks && project.risks.length > 0 ? [
                new Paragraph({
                  text: "Risks",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                ...project.risks.map(risk => 
                  new Paragraph({
                    text: `• ${risk}`,
                  })
                ),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Dependencies section
              ...(project.dependencies && project.dependencies.length > 0 ? [
                new Paragraph({
                  text: "Dependencies",
                  heading: HeadingLevel.HEADING_2,
                }),
                
                ...project.dependencies.map(dependency => 
                  new Paragraph({
                    text: `• ${dependency}`,
                  })
                ),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Milestones section
              ...(milestones.length > 0 ? [
                new Paragraph({
                  text: "Milestones",
                  heading: HeadingLevel.HEADING_1,
                }),
                
                new Table({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new TableRow({                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Target Date", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Completion Date", bold: true })] })],
                        }),
                      ],
                    }),
                    ...milestones.map(milestone =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ text: milestone.title })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: milestone.status.replace("_", " ").toUpperCase() })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: formatDate(milestone.target_date) })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: formatDate(milestone.completion_date) })],
                          }),
                        ],
                      })
                    ),
                  ],
                }),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Tasks section
              ...(tasks.length > 0 ? [
                new Paragraph({
                  text: "Tasks",
                  heading: HeadingLevel.HEADING_1,
                }),
                
                new Table({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new TableRow({                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Title", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Priority", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Assigned To", bold: true })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Due Date", bold: true })] })],
                        }),
                      ],
                    }),
                    ...tasks.map(task =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ text: task.title })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: task.status.replace("_", " ").toUpperCase() })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: task.priority })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: task.assigned_to || "Unassigned" })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: formatDate(task.due_date) })],
                          }),
                        ],
                      })
                    ),
                  ],
                }),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Results section
              ...(project.results ? [
                new Paragraph({
                  text: "Results",
                  heading: HeadingLevel.HEADING_1,
                }),
                
                new Paragraph({
                  text: project.results,
                }),
                
                new Paragraph({ text: "" }), // Empty line
              ] : []),
              
              // Footer
              new Paragraph({
                children: [
                  new TextRun({ text: "Generated on: ", italics: true }),
                  new TextRun({ text: format(new Date(), "PPP"), italics: true }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project_report.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Project exported to DOCX successfully.",
      })
    } catch (error) {
      console.error("Error exporting to DOCX:", error)
      toast({
        title: "Error",
        description: "Failed to export project to DOCX.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading project details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested project could not be found.</p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard/projects")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-muted-foreground">{project.system}</p>
          </div>
        </div>        <div className="flex items-center gap-2">
          <Badge 
            className={`${getStatusColor(project.status)} text-white`}
          >
            {project.status.replace("_", " ").toUpperCase()}
          </Badge>
          <Badge 
            className={`${getPriorityColor(project.priority)} text-white`}
          >
            {project.priority} Priority
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportToDocx}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export DOCX
              </>
            )}
          </Button>
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress_percentage}%</div>
            <Progress value={project.progress_percentage} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedTasks()}/{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedMilestones()}/{milestones.length}</div>
            <p className="text-xs text-muted-foreground">
              Achieved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(calculateTimelineProgress())}%</div>
            <p className="text-xs text-muted-foreground">
              Time elapsed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Objective</h4>
                  <p className="text-muted-foreground">{project.objective}</p>
                </div>
                
                {project.results && (
                  <div>
                    <h4 className="font-semibold mb-2">Results</h4>
                    <p className="text-muted-foreground">{project.results}</p>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Date</p>
                    <p className="font-semibold">{formatDate(project.target_completion_date)}</p>
                  </div>
                  {project.actual_completion_date && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Actual Completion</p>
                        <p className="font-semibold">{formatDate(project.actual_completion_date)}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Project Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(project.budget_estimated || project.budget_actual) && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {project.budget_estimated && (
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated</p>
                          <p className="font-semibold">${project.budget_estimated.toLocaleString()}</p>
                        </div>
                      )}
                      {project.budget_actual && (
                        <div>
                          <p className="text-sm text-muted-foreground">Actual</p>
                          <p className="font-semibold">${project.budget_actual.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {project.assigned_to && project.assigned_to.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.assigned_to.map((person, index) => (
                        <Badge key={index} variant="outline">{person}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.contractor_involved && (
                  <div>
                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                      <Users className="h-3 w-3" />
                      Contractor Involved
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tags and Success Criteria */}
          <div className="grid gap-6 md:grid-cols-2">
            {project.tags && project.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {project.success_criteria && project.success_criteria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Success Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.success_criteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Risks and Dependencies */}
          {(project.risks?.length > 0 || project.dependencies?.length > 0) && (
            <div className="grid gap-6 md:grid-cols-2">
              {project.risks && project.risks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {project.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {project.dependencies && project.dependencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {project.dependencies.map((dependency, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ExternalLink className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{dependency}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Milestones</CardTitle>
                  <CardDescription>
                    Track major milestones and their completion status
                  </CardDescription>
                </div>
                <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Milestone</DialogTitle>
                      <DialogDescription>
                        Create a new milestone for this project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="milestone-title">Title</Label>
                        <Input
                          id="milestone-title"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          placeholder="Enter milestone title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-description">Description</Label>
                        <Textarea
                          id="milestone-description"
                          value={newMilestone.description}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                          placeholder="Enter milestone description (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-target-date">Target Date</Label>
                        <Input
                          id="milestone-target-date"
                          type="date"
                          value={newMilestone.target_date}
                          onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-status">Status</Label>
                        <Select
                          value={newMilestone.status}
                          onValueChange={(value) => setNewMilestone({ ...newMilestone, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddMilestoneOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddMilestone}>
                        <Save className="mr-2 h-4 w-4" />
                        Add Milestone
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Milestones</h3>
                  <p className="text-muted-foreground">No milestones have been defined for this project yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{milestone.title}</h4>
                        <div className="flex items-center gap-2">
                          <Select
                            value={milestone.status}
                            onValueChange={(value) => handleUpdateMilestoneStatus(milestone.id, value)}
                          >
                            <SelectTrigger className="w-auto">
                              <Badge 
                                className={`${getStatusColor(milestone.status)} text-white border-0`}
                              >
                                {milestone.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {milestone.description && (
                        <p className="text-muted-foreground mb-3">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Target: {formatDate(milestone.target_date)}
                        </div>
                        {milestone.completion_date && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Completed: {formatDate(milestone.completion_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>
                    View all tasks associated with this project
                  </CardDescription>
                </div>
                <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task for this project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                          id="task-title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Enter task description (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-status">Status</Label>
                          <Select
                            value={newTask.status}
                            onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="task-priority">Priority</Label>
                          <Select
                            value={newTask.priority}
                            onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-assigned-to">Assigned To</Label>
                          <Input
                            id="task-assigned-to"
                            value={newTask.assigned_to}
                            onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                            placeholder="Enter assignee name (optional)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="task-due-date">Due Date</Label>
                          <Input
                            id="task-due-date"
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="task-estimated-hours">Estimated Hours</Label>
                        <Input
                          id="task-estimated-hours"
                          type="number"
                          value={newTask.estimated_hours}
                          onChange={(e) => setNewTask({ ...newTask, estimated_hours: Number(e.target.value) })}
                          placeholder="Enter estimated hours (optional)"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTask}>
                        <Save className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Tasks</h3>
                  <p className="text-muted-foreground">No tasks have been created for this project yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${getPriorityColor(task.priority)} text-white`}
                          >
                            {task.priority}
                          </Badge>
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}
                          >
                            <SelectTrigger className="w-auto">
                              <Badge 
                                className={`${getStatusColor(task.status)} text-white border-0`}
                              >
                                {task.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(task.due_date)}
                          </div>
                        )}
                        {task.assigned_to && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Assigned to: {task.assigned_to}
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Est: {task.estimated_hours}h
                          </div>
                        )}
                        {task.actual_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Actual: {task.actual_hours}h
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="updates" className="space-y-4">
          <ProjectUpdates
            projectId={project.id}
            updates={updates}
            onUpdatesChange={setUpdates}
          />
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <ProjectAttachments
            projectId={project.id}
            attachments={attachments}
            onAttachmentsUpdate={setAttachments}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Complete project information and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project ID</p>
                  <p className="font-mono text-sm">{project.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System</p>
                  <p className="font-semibold">{project.system}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                  <p className="font-semibold">{project.timeline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="font-semibold">{format(new Date(project.created_at), "MMM dd, yyyy 'at' HH:mm")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">{format(new Date(project.updated_at), "MMM dd, yyyy 'at' HH:mm")}</p>
                </div>
              </div>

              {project.images && project.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Project Images</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {project.images.map((image, index) => (
                      <div key={index} className="border rounded-lg p-2">
                        <img 
                          src={image} 
                          alt={`Project image ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
