"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"

interface ProjectsListProps {
  projects: any[]
  onProjectUpdate?: (projectId: string, updates: any) => void
  onProjectDelete?: (projectId: string) => void
}

export function ProjectsList({ projects: initialProjects, onProjectUpdate, onProjectDelete }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSystem, setFilterSystem] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { toast } = useToast()
  const { supabase } = useSupabase()

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete projects.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("improvement_projects")
        .delete()
        .eq("id", projectToDelete.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Remove project from local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete.id))
      
      // Call parent callback if provided
      if (onProjectDelete) {
        onProjectDelete(projectToDelete.id)
      }

      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const openDeleteDialog = (project: any) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  // Get unique systems
  const systems = Array.from(new Set(projects.map((project) => project.system)))

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      const matchesStatus = filterStatus === "all" || project.status === filterStatus
      const matchesSystem = filterSystem === "all" || project.system === filterSystem
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.objective.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesSystem && matchesSearch
    })
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planned":
        return "bg-gray-500"
      case "Ongoing":
        return "bg-blue-500"
      case "Complete":
        return "bg-green-500"
      case "not_started":
        return "bg-gray-500"
      case "planning":
        return "bg-blue-500"
      case "in_progress":
        return "bg-yellow-500"
      case "on_hold":
        return "bg-orange-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSystem} onValueChange={setFilterSystem}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                {systems.map((system) => (
                  <SelectItem key={system} value={system}>
                    {system}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSort("created_at")}>
                  Date Created {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("title")}>
                  Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("system")}>
                  System {sortBy === "system" && (sortOrder === "asc" ? "↑" : "↓")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mt-2 text-lg font-semibold">No projects found</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              {searchQuery || filterStatus !== "all" || filterSystem !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating a new improvement project"}
            </p>
            <Link href="/dashboard/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden group hover:shadow-md transition-shadow relative">
                {/* Make the entire card clickable */}
                <Link href={`/dashboard/projects/${project.id}`} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{project.title}</CardTitle>
                        <CardDescription className="line-clamp-1 mt-1">{project.system}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{project.objective}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 p-3">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                        <span className="text-xs capitalize">{project.status.replace("_", " ")}</span>
                      </div>
                      {project.contractor_involved && (
                        <Badge variant="outline" className="text-xs">
                          Contractor
                        </Badge>
                      )}
                    </div>
                  </CardFooter>
                </Link>
                
                {/* Actions menu - positioned absolutely to overlay */}
                <div className="absolute top-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border shadow-sm" 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openDeleteDialog(project)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
