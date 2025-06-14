"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Target } from "lucide-react" // Import Target component
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"

interface GoalsListProps {
  goals: any[]
  onGoalDelete?: (goalId: string) => void
}

export function GoalsList({ goals: initialGoals, onGoalDelete }: GoalsListProps) {
  const [goals, setGoals] = useState(initialGoals)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { supabase } = useSupabase()

  // Handle delete goal
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return
    
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete goals.",
          variant: "destructive",
        })
        return
      }      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalToDelete.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Remove goal from local state
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalToDelete.id))
      
      // Call parent callback if provided
      if (onGoalDelete) {
        onGoalDelete(goalToDelete.id)
      }

      toast({
        title: "Goal deleted",
        description: "The goal has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting goal",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setGoalToDelete(null)
    }
  }

  const openDeleteDialog = (goal: any) => {
    setGoalToDelete(goal)
    setDeleteDialogOpen(true)
  }

  // Get unique categories
  const categories = Array.from(new Set(goals.map((goal) => goal.category)))

  // Filter and sort goals
  const filteredGoals = goals
    .filter((goal) => {
      const matchesStatus = filterStatus === "all" || goal.status === filterStatus
      const matchesCategory = filterCategory === "all" || goal.category === filterCategory
      const matchesSearch =
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesCategory && matchesSearch
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
      case "Not Started":
        return "bg-gray-400 dark:bg-gray-500"
      case "In Progress":
        return "bg-blue-500"
      case "Completed":
        return "bg-green-500"
      case "Stalled":
        return "bg-amber-500"
      default:
        return "bg-gray-400 dark:bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search goals..."
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
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Stalled">Stalled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
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
              <DropdownMenuItem onClick={() => handleSort("deadline")}>
                Deadline {sortBy === "deadline" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("title")}>
                Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
            <Target className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No goals found</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all" || filterCategory !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating a new goal"}
          </p>
          <Link href="/dashboard/goals/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="card-hover overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{goal.title}</CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">{goal.category}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/goals/${goal.id}/edit`}>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(goal)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{goal.description}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 p-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(goal.status)}`} />
                    <span className="text-xs">{goal.status}</span>
                  </div>
                  {goal.deadline && (
                    <Badge variant="outline" className="text-xs">
                      Due {formatDistanceToNow(new Date(goal.deadline), { addSuffix: true })}
                    </Badge>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{goalToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteGoal}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
