"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { ProjectProposalGenerator } from "@/components/ai/project-proposal-generator"

export default function NewProjectPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
    // Form state using the enhanced project structure
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    system: "",
    priority: "Medium",
    timeline: "", // Required field for database
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
  
  // States for array field management
  const [newTag, setNewTag] = useState("")
  const [newDependency, setNewDependency] = useState("")
  const [newRisk, setNewRisk] = useState("")
  const [newCriteria, setNewCriteria] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {      // Validation
      if (!formData.title || !formData.objective || !formData.system || !formData.timeline) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Title, Objective, System, Timeline).",
          variant: "destructive",
        })
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a project",
          variant: "destructive",
        })
        return
      }      // Prepare data for database insertion with enhanced schema
      const projectData = {
        user_id: user.id,
        title: formData.title,
        objective: formData.objective,
        system: formData.system,
        status: "Planned", // Default status for new projects
        timeline: formData.timeline, // Required field
        priority: formData.priority,
        start_date: formData.start_date?.toISOString().split('T')[0] || null,
        target_completion_date: formData.target_completion_date?.toISOString().split('T')[0] || null,
        progress_percentage: formData.progress_percentage || 0,
        budget_estimated: formData.budget_estimated ? parseFloat(formData.budget_estimated) : null,
        budget_actual: formData.budget_actual ? parseFloat(formData.budget_actual) : null,
        contractor_involved: formData.contractor_involved,
        tags: formData.tags.length > 0 ? formData.tags : null,
        assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to : null,
        dependencies: formData.dependencies.length > 0 ? formData.dependencies : null,
        risks: formData.risks.length > 0 ? formData.risks : null,
        success_criteria: formData.success_criteria.length > 0 ? formData.success_criteria : null,
        images: []
      }

      const { error } = await supabase.from("improvement_projects").insert(projectData)

      if (error) {
        throw error
      }

      toast({
        title: "Project created",
        description: "Your improvement project has been created successfully.",
      })

      router.push("/dashboard/projects")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
    <div className="mx-auto max-w-4xl">
      <Card className="border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Create Improvement Project</CardTitle>
          <CardDescription>Document a comprehensive improvement initiative with enhanced project tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
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
                </div>                <div>
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
                  <Label htmlFor="timeline">Timeline *</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., 2 weeks, 3 months"
                    required
                  />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_estimated: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, budget_actual: e.target.value }))}
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
                  </div>
                </div>
              </div>      
              
              <div className="flex justify-end space-x-2 pt-4 pb-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <ProjectProposalGenerator
        title={formData.title || ""}
        objective={formData.objective || ""}
        system={formData.system || ""}
        onProposalGenerated={(proposal) => {
          // Optionally auto-fill some fields from the proposal
          if (proposal.proposal.timeline.totalDuration) {
            // Could set dates based on timeline if needed
          }
        }}
      />
    </div>
  )
}
