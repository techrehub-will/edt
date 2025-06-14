"use client"

import { useState } from "react"
import { Grid3X3, List, LayoutDashboard, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectsList } from "./projects-list"
import { ProjectKanban } from "./project-kanban"
import { ProjectsHeader } from "./projects-header"
import { ProjectAnalytics } from "./project-analytics"
import { ProjectExport } from "./project-export"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface ProjectsDashboardProps {
  projects: any[]
}

export function ProjectsDashboard({ projects: initialProjects }: ProjectsDashboardProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView] = useState<"list" | "kanban" | "analytics" | "export">("list")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleProjectUpdate = async (projectId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from("improvement_projects")
        .update(updates)
        .eq("id", projectId)

      if (error) throw error

      // Update local state
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, ...updates }
            : project
        )
      )

      toast({
        title: "Project updated",
        description: "Project has been successfully updated.",
      })    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleProjectCreate = async (projectData: any) => {
    // Add the new project to local state
    setProjects(prev => [projectData, ...prev])
    
    toast({
      title: "Project created",
      description: "New project has been added successfully.",
    })
  }

  const handleStatusChange = (projectId: string, newStatus: string) => {
    handleProjectUpdate(projectId, { status: newStatus })
  }

  return (
    <div className="space-y-6">
      <ProjectsHeader />      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            Kanban Board
          </Button>
          <Button
            variant={view === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("analytics")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={view === "export" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("export")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="min-h-[600px]">
        {view === "list" && (
          <ProjectsList 
            projects={projects} 
            onProjectUpdate={handleProjectUpdate}
          />        )}
        
        {view === "kanban" && (
          <ProjectKanban 
            projects={projects} 
            onProjectUpdate={handleStatusChange}
            onProjectCreate={handleProjectCreate}
          />
        )}
        
        {view === "analytics" && (
          <ProjectAnalytics projects={projects} />
        )}
        
        {view === "export" && (
          <ProjectExport projects={projects} />
        )}
      </div>
    </div>
  )
}
