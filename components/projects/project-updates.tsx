"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  MessageSquare,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

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

interface ProjectUpdatesProps {
  projectId: string
  updates: ProjectUpdate[]
  onUpdatesChange: (updates: ProjectUpdate[]) => void
}

const UPDATE_TYPES = [
  { value: "note", label: "General Note", icon: MessageSquare },
  { value: "progress", label: "Progress Update", icon: CheckCircle },
  { value: "milestone", label: "Milestone", icon: Calendar },
  { value: "issue", label: "Issue/Blocker", icon: AlertCircle },
  { value: "info", label: "Information", icon: Info }
]

export function ProjectUpdates({ projectId, updates, onUpdatesChange }: ProjectUpdatesProps) {
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newUpdate, setNewUpdate] = useState({
    update_type: "note",
    title: "",
    content: "",
    attachments: [] as string[]
  })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleAddUpdate = async () => {
    if (!newUpdate.content.trim()) {
      toast({
        title: "Error",
        description: "Update content is required",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("project_updates")
        .insert({
          project_id: projectId,
          user_id: user.id,
          update_type: newUpdate.update_type,
          title: newUpdate.title.trim() || null,
          content: newUpdate.content.trim(),
          attachments: newUpdate.attachments
        })
        .select()
        .single()

      if (error) throw error

      // Update the local state
      onUpdatesChange([data, ...updates])

      // Reset form
      setNewUpdate({
        update_type: "note",
        title: "",
        content: "",
        attachments: []
      })
      setIsAddUpdateOpen(false)

      toast({
        title: "Success",
        description: "Update added successfully"
      })
    } catch (error) {
      console.error("Error adding update:", error)
      toast({
        title: "Error",
        description: "Failed to add update",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return

    try {
      const { error } = await supabase
        .from("project_updates")
        .delete()
        .eq("id", updateId)

      if (error) throw error

      // Update local state
      onUpdatesChange(updates.filter(update => update.id !== updateId))

      toast({
        title: "Success",
        description: "Update deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting update:", error)
      toast({
        title: "Error",
        description: "Failed to delete update",
        variant: "destructive"
      })
    }
  }

  const getUpdateTypeIcon = (type: string) => {
    const updateType = UPDATE_TYPES.find(t => t.value === type)
    const IconComponent = updateType?.icon || MessageSquare
    return <IconComponent className="h-4 w-4" />
  }

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case "progress": return "bg-green-500"
      case "milestone": return "bg-blue-500"
      case "issue": return "bg-red-500"
      case "info": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Updates</CardTitle>
            <CardDescription>
              Timeline of project updates and notes
            </CardDescription>
          </div>
          <Dialog open={isAddUpdateOpen} onOpenChange={setIsAddUpdateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Update
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Project Update</DialogTitle>
                <DialogDescription>
                  Add a new update, note, or milestone to track project progress.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="update-type">Update Type</Label>
                  <Select
                    value={newUpdate.update_type}
                    onValueChange={(value) => setNewUpdate({ ...newUpdate, update_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select update type" />
                    </SelectTrigger>
                    <SelectContent>
                      {UPDATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="update-title">Title (Optional)</Label>
                  <Input
                    id="update-title"
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="Enter a title for this update"
                  />
                </div>
                <div>
                  <Label htmlFor="update-content">Content</Label>
                  <Textarea
                    id="update-content"
                    value={newUpdate.content}
                    onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                    placeholder="Enter update details..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddUpdateOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddUpdate} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Update"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {updates.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Updates</h3>
            <p className="text-muted-foreground mb-4">No updates have been posted for this project yet.</p>
            <Button onClick={() => setIsAddUpdateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Update
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${getUpdateTypeColor(update.update_type)} text-white border-0`}
                    >
                      <div className="flex items-center gap-1">
                        {getUpdateTypeIcon(update.update_type)}
                        {UPDATE_TYPES.find(t => t.value === update.update_type)?.label || update.update_type}
                      </div>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(update.created_at), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUpdate(update.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {update.title && (
                  <h4 className="font-semibold mb-2">{update.title}</h4>
                )}

                <p className="text-muted-foreground whitespace-pre-wrap">{update.content}</p>

                {update.attachments && update.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {update.attachments.map((attachment, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
