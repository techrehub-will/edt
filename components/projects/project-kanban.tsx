"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Plus, Calendar as CalendarIcon, Users, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  title: string
  objective: string
  status: string
  priority: string
  progress_percentage: number
  start_date?: string
  target_completion_date?: string
  actual_completion_date?: string
  budget_estimated?: number
  budget_actual?: number
  assigned_to?: string[]
  tags?: string[]
  dependencies?: string[]
  risks?: string[]
  success_criteria?: string[]
  contractor_involved?: boolean
  system: string
}

interface ProjectKanbanProps {
  projects: Project[]
  onProjectUpdate: (projectId: string, newStatus: string) => void
  onProjectCreate?: (projectData: Partial<Project>) => void
}

const statusColumns = [
  { id: "planning", title: "Planning", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
  { id: "on-hold", title: "On Hold", color: "bg-gray-500" }
]

// Mapping from database status to Kanban status
const dbToKanbanStatus = {
  "Planned": "planning",
  "Ongoing": "in-progress", 
  "Complete": "completed",
  "In Progress": "in-progress",
  "Review": "review",
  "On Hold": "on-hold"
}

// Mapping from Kanban status to database status
const kanbanToDbStatus = {
  "planning": "Planned",
  "in-progress": "Ongoing",
  "review": "Review", 
  "completed": "Complete",
  "on-hold": "On Hold"
}

const priorityColors = {
  "High": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Low": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
}

export function ProjectKanban({ projects, onProjectUpdate, onProjectCreate }: ProjectKanbanProps) {
  const [projectsByStatus, setProjectsByStatus] = useState(() => {
    const grouped = statusColumns.reduce((acc, column) => {
      acc[column.id] = projects.filter(project => {
        const kanbanStatus = dbToKanbanStatus[project.status as keyof typeof dbToKanbanStatus] || "planning"
        return kanbanStatus === column.id
      }).map(project => ({
        ...project,
        status: dbToKanbanStatus[project.status as keyof typeof dbToKanbanStatus] || "planning"
      }))
      return acc    }, {} as Record<string, Project[]>)
    return grouped
  })
  const [isAddingProject, setIsAddingProject] = useState(false)
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  // Update projects when props change
  useEffect(() => {
    console.log("Projects received in Kanban:", projects)
    console.log("Projects with status mapping:", projects.map(p => ({ 
      id: p.id, 
      title: p.title, 
      status: p.status, 
      mappedStatus: dbToKanbanStatus[p.status as keyof typeof dbToKanbanStatus] || "planning" 
    })))
    
    const grouped = statusColumns.reduce((acc, column) => {
      acc[column.id] = projects.filter(project => {
        const kanbanStatus = dbToKanbanStatus[project.status as keyof typeof dbToKanbanStatus] || "planning"
        return kanbanStatus === column.id
      }).map(project => ({
        ...project,
        status: dbToKanbanStatus[project.status as keyof typeof dbToKanbanStatus] || "planning"
      }))
      return acc
    }, {} as Record<string, Project[]>)
    
    console.log("Grouped projects:", grouped)
    setProjectsByStatus(grouped)
  }, [projects])
  
  const moveProject = (projectId: string, newStatus: string) => {
    const currentProject = Object.values(projectsByStatus)
      .flat()
      .find(p => p.id === projectId)
    
    if (!currentProject || currentProject.status === newStatus) return

    const oldStatus = currentProject.status
    const updatedProject = { ...currentProject, status: newStatus }

    setProjectsByStatus(prev => ({
      ...prev,
      [oldStatus]: prev[oldStatus].filter(p => p.id !== projectId),
      [newStatus]: [...prev[newStatus], updatedProject]
    }))

    // Convert Kanban status back to database status for the callback
    const dbStatus = kanbanToDbStatus[newStatus as keyof typeof kanbanToDbStatus] || "Planned"
    onProjectUpdate(projectId, dbStatus)
  }
  
  const handleCreateProject = async (projectData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a project.",
          variant: "destructive",
        })
        return
      }

      // Map form data to database schema
      const newProject = {
        user_id: user.id,
        title: projectData.title,
        objective: projectData.objective,
        system: projectData.system,
        status: "Planned", // Use existing status values
        priority: projectData.priority || "Medium",
        start_date: projectData.start_date || null,
        target_completion_date: projectData.target_completion_date || null,
        progress_percentage: projectData.progress_percentage || 0,
        budget_estimated: projectData.budget_estimated || null,
        budget_actual: projectData.budget_actual || null,
        contractor_involved: projectData.contractor_involved || false,
        assigned_to: projectData.assigned_to || null,
        tags: projectData.tags || null,
        dependencies: projectData.dependencies || null,
        risks: projectData.risks || null,
        success_criteria: projectData.success_criteria || null,
        results: null // Will be filled when project is completed
      }

      const { data, error } = await supabase
        .from("improvement_projects")
        .insert(newProject)
        .select()
        .single()

      if (error) throw error

      // Convert status for UI consistency
      const uiProject = {
        ...data,
        status: "planning", // Convert "Planned" to "planning" for UI
      }

      // Add to local state
      setProjectsByStatus(prev => ({
        ...prev,
        planning: [...prev.planning, uiProject]
      }))

      // Call parent callback if provided
      if (onProjectCreate) {
        onProjectCreate(uiProject)
      }

      setIsAddingProject(false)
      toast({
        title: "Project created",
        description: "New project has been added to the planning column.",
      })
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
      {statusColumns.map(column => (
        <div key={column.id} className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {projectsByStatus[column.id]?.length || 0}
            </Badge>
          </div>

          <div className="flex-1 space-y-3 p-2 rounded-lg border-2 border-dashed border-muted-foreground/20 min-h-[200px]">
            {projectsByStatus[column.id]?.map((project) => (
              <Card key={project.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${priorityColors[project.priority as keyof typeof priorityColors]}`}
                      >
                        {project.priority}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusColumns
                            .filter(col => col.id !== project.status)
                            .map(col => (
                              <DropdownMenuItem 
                                key={col.id}
                                onClick={() => moveProject(project.id, col.id)}
                              >
                                Move to {col.title}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.objective}
                  </p>
                  
                  <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{project.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 relative overflow-hidden">
                        <div className={`
                          absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300
                          ${(project.progress_percentage || 0) === 0 ? 'w-0' : ''}
                          ${(project.progress_percentage || 0) > 0 && (project.progress_percentage || 0) < 10 ? 'w-1' : ''}
                          ${(project.progress_percentage || 0) >= 10 && (project.progress_percentage || 0) < 25 ? 'w-1/6' : ''}
                          ${(project.progress_percentage || 0) >= 25 && (project.progress_percentage || 0) < 50 ? 'w-1/4' : ''}
                          ${(project.progress_percentage || 0) >= 50 && (project.progress_percentage || 0) < 75 ? 'w-1/2' : ''}
                          ${(project.progress_percentage || 0) >= 75 && (project.progress_percentage || 0) < 100 ? 'w-3/4' : ''}
                          ${(project.progress_percentage || 0) >= 100 ? 'w-full' : ''}                        `} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>
                        {project.target_completion_date ? 
                          formatDistanceToNow(new Date(project.target_completion_date), { addSuffix: true }) :
                          "No deadline"
                        }
                      </span>                    </div>
                    
                    {project.assigned_to && project.assigned_to.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{project.assigned_to.length}</span>
                      </div>
                    )}
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {project.system}
                  </Badge>
                </CardContent>              </Card>
            ))}
              {column.id === "planning" && (
              <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <ProjectForm onSubmit={handleCreateProject} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ProjectFormProps {
  onSubmit: (data: any) => void
}

function ProjectForm({ onSubmit }: ProjectFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    system: "",
    priority: "Medium",
    start_date: undefined as Date | undefined,
    target_completion_date: undefined as Date | undefined,
    progress_percentage: 0,
    budget_estimated: "",
    budget_actual: "",
    contractor_involved: false,
    tags: [] as string[],
    assigned_to: [] as string[],
    dependencies: [] as string[],
    risks: [] as string[],
    success_criteria: [] as string[]
  })
  const [newTag, setNewTag] = useState("")
  const [newDependency, setNewDependency] = useState("")
  const [newRisk, setNewRisk] = useState("")
  const [newCriteria, setNewCriteria] = useState("")
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.objective || !formData.system) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Objective, System).",
        variant: "destructive",
      })
      return
    }

    const submitData = {
      ...formData,
      start_date: formData.start_date?.toISOString().split('T')[0],
      target_completion_date: formData.target_completion_date?.toISOString().split('T')[0],
      budget_estimated: formData.budget_estimated ? parseFloat(formData.budget_estimated) : null,
      budget_actual: formData.budget_actual ? parseFloat(formData.budget_actual) : null,
      progress_percentage: formData.progress_percentage || 0,
      tags: formData.tags.length > 0 ? formData.tags : null,
      assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to : null,
      dependencies: formData.dependencies.length > 0 ? formData.dependencies : null,
      risks: formData.risks.length > 0 ? formData.risks : null,
      success_criteria: formData.success_criteria.length > 0 ? formData.success_criteria : null
    }

    onSubmit(submitData)
  }
  // Helper function to handle generic list item operations
  const addListItem = (list: string[], newItem: string, setListFn: (list: string[]) => void, setNewItemFn: (item: string) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setListFn([...list, newItem.trim()])
      setNewItemFn("")
    }
  }

  const removeListItem = (list: string[], itemToRemove: string, setListFn: (list: string[]) => void) => {
    setListFn(list.filter(item => item !== itemToRemove))
  }

  // Tag handlers
  const addTag = () => addListItem(formData.tags, newTag, 
    (tags) => setFormData(prev => ({ ...prev, tags })), 
    setNewTag)
  
  const removeTag = (tagToRemove: string) => removeListItem(
    formData.tags, 
    tagToRemove, 
    (tags) => setFormData(prev => ({ ...prev, tags }))
  )

  // Dependency handlers
  const addDependency = () => addListItem(
    formData.dependencies, 
    newDependency, 
    (dependencies) => setFormData(prev => ({ ...prev, dependencies })), 
    setNewDependency
  )
  
  const removeDependency = (depToRemove: string) => removeListItem(
    formData.dependencies, 
    depToRemove, 
    (dependencies) => setFormData(prev => ({ ...prev, dependencies }))
  )

  // Risk handlers
  const addRisk = () => addListItem(
    formData.risks, 
    newRisk, 
    (risks) => setFormData(prev => ({ ...prev, risks })), 
    setNewRisk
  )
  
  const removeRisk = (riskToRemove: string) => removeListItem(
    formData.risks, 
    riskToRemove, 
    (risks) => setFormData(prev => ({ ...prev, risks }))
  )

  // Success criteria handlers
  const addCriteria = () => addListItem(
    formData.success_criteria, 
    newCriteria, 
    (criteria) => setFormData(prev => ({ ...prev, success_criteria: criteria })), 
    setNewCriteria
  )
  
  const removeCriteria = (criteriaToRemove: string) => removeListItem(
    formData.success_criteria, 
    criteriaToRemove, 
    (criteria) => setFormData(prev => ({ ...prev, success_criteria: criteria }))
  )

  const addAssignee = () => {
    const email = prompt("Enter team member email:")
    if (email && email.trim() && !formData.assigned_to.includes(email.trim())) {
      setFormData(prev => ({
        ...prev,
        assigned_to: [...prev.assigned_to, email.trim()]
      }))
    }
  }

  const removeAssignee = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.filter(email => email !== emailToRemove)
    }))
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter project title"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="objective">Objective *</Label>
          <Textarea
            id="objective"
            value={formData.objective}
            onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
            placeholder="Describe the project objective and expected outcomes"
            rows={3}
            required
          />
        </div>

        <div>
          <Label htmlFor="system">System/Area *</Label>
          <Select value={formData.system} onValueChange={(value) => setFormData(prev => ({ ...prev, system: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLC">PLC</SelectItem>
              <SelectItem value="SCADA">SCADA</SelectItem>
              <SelectItem value="Hydraulics">Hydraulics</SelectItem>
              <SelectItem value="Pneumatics">Pneumatics</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Process">Process</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(formData.start_date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label>Target Completion Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.target_completion_date ? format(formData.target_completion_date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.target_completion_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, target_completion_date: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress_percentage.toString()}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              progress_percentage: parseInt(e.target.value) || 0 
            }))}
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="budget_estimated">Estimated Budget</Label>
          <Input
            id="budget_estimated"
            type="number"
            step="0.01"
            value={formData.budget_estimated}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_estimated: e.target.value }))
            }
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="budget_actual">Actual Budget</Label>
          <Input
            id="budget_actual"
            type="number"
            step="0.01"
            value={formData.budget_actual}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_actual: e.target.value }))
            }
            placeholder="0.00"
          />
        </div>

        <div>
          <Label>Contractor Involved</Label>
          <Switch
            id="contractor"
            checked={formData.contractor_involved}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contractor_involved: checked }))}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="sm">Add</Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Assigned Team Members</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.assigned_to.map((email) => (
              <Badge key={email} variant="outline" className="cursor-pointer" onClick={() => removeAssignee(email)}>
                {email} ×
              </Badge>
            ))}
          </div>
          <Button type="button" onClick={addAssignee} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        <div className="md:col-span-2">
          <Label>Dependencies</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.dependencies.map((dep) => (
              <Badge key={dep} variant="secondary" className="cursor-pointer" onClick={() => removeDependency(dep)}>
                {dep} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDependency}
              onChange={(e) => setNewDependency(e.target.value)}
              placeholder="Add dependency"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
            />
            <Button type="button" onClick={addDependency} size="sm">Add</Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Risks</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.risks.map((risk) => (
              <Badge key={risk} variant="secondary" className="cursor-pointer" onClick={() => removeRisk(risk)}>
                {risk} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRisk}
              onChange={(e) => setNewRisk(e.target.value)}
              placeholder="Add risk"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRisk())}
            />
            <Button type="button" onClick={addRisk} size="sm">Add</Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Success Criteria</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.success_criteria.map((criteria) => (
              <Badge key={criteria} variant="secondary" className="cursor-pointer" onClick={() => removeCriteria(criteria)}>
                {criteria} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
              placeholder="Add success criteria"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
            />
            <Button type="button" onClick={addCriteria} size="sm">Add</Button>
          </div>        </div>
      </div>      
      
      <div className="flex justify-end space-x-2 pt-4 pb-2">
        <Button type="button" variant="outline" onClick={() => setFormData({
          title: "",
          objective: "",
          system: "",
          priority: "Medium",
          start_date: undefined,
          target_completion_date: undefined,
          progress_percentage: 0,
          budget_estimated: "",
          budget_actual: "",
          contractor_involved: false,
          tags: [],
          assigned_to: [],
          dependencies: [],
          risks: [],
          success_criteria: []
        })}>
          Cancel
        </Button>
        <Button type="submit">
          Create Project
        </Button>
      </div>
    </form>
  )
}

