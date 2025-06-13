"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface ProjectsListProps {
  projects: any[]
}

export function ProjectsList({ projects: initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSystem, setFilterSystem] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

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
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
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
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">{project.system}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/projects/${project.id}/edit`}>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{project.objective}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                    <span className="text-xs">{project.status}</span>
                  </div>
                  {project.contractor_involved && (
                    <Badge variant="outline" className="text-xs">
                      Contractor
                    </Badge>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
