"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilePreview } from "@/components/ui/file-preview"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"

interface LogsListProps {
  logs: any[]
  onLogDelete?: (logId: string) => void
}

export function LogsList({ logs: initialLogs, onLogDelete }: LogsListProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [logs, setLogs] = useState(initialLogs)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterSystem, setFilterSystem] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get unique systems
  const systems = Array.from(new Set(logs.map((log) => log.system)))

  // Filter and sort logs
  const filteredLogs = logs
    .filter((log) => {
      const matchesSystem = filterSystem === "all" || log.system === filterSystem
      const matchesSearch =
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSystem && matchesSearch
    })
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }    })

  // Handle delete log
  const handleDeleteLog = async () => {
    if (!logToDelete) return
    
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete logs.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("technical_logs")
        .delete()
        .eq("id", logToDelete.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Remove log from local state
      setLogs(prevLogs => prevLogs.filter(l => l.id !== logToDelete.id))
      
      // Call parent callback if provided
      if (onLogDelete) {
        onLogDelete(logToDelete.id)
      }

      toast({
        title: "Log deleted",
        description: "The technical log has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting log",
        description: error.message || "Failed to delete log",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setLogToDelete(null)
    }
  }

  const openDeleteDialog = (log: any) => {
    setLogToDelete(log)
    setDeleteDialogOpen(true)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")    }
  }

  const exportToWord = async (log: any) => {
    try {
      // Dynamic import for document generation
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")

      // Get current user details from Supabase
      let currentUser = null
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          currentUser = user
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }

      const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
      }

      // Create document with professional formatting
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: "TECHNICAL LOG REPORT",
                  bold: true,
                  size: 32,
                })
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            // Log Title
            new Paragraph({
              children: [
                new TextRun({
                  text: log.title,
                  bold: true,
                  size: 28,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 }
            }),

            // Log Information Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "LOG INFORMATION",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "System: ", bold: true }),
                new TextRun({ text: log.system || "Not specified" })
              ],
              spacing: { after: 100 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Log ID: ", bold: true }),
                new TextRun({ text: log.id })
              ],
              spacing: { after: 100 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Created: ", bold: true }),
                new TextRun({ text: formatDate(log.created_at) })
              ],
              spacing: { after: 100 }
            }),

            ...(log.updated_at ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Last Updated: ", bold: true }),
                  new TextRun({ text: formatDate(log.updated_at) })
                ],
                spacing: { after: 200 }
              })
            ] : []),

            // Tags section
            ...(log.tags && log.tags.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "TAGS",
                    bold: true,
                    size: 24,
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: log.tags.join(", ") })
                ],
                spacing: { after: 200 }
              })
            ] : []),

            // Problem Description
            new Paragraph({
              children: [
                new TextRun({
                  text: "PROBLEM DESCRIPTION",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: log.description || "No description provided" })
              ],
              spacing: { after: 200 }
            }),

            // Resolution
            new Paragraph({
              children: [
                new TextRun({
                  text: "RESOLUTION",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: log.resolution || "Resolution pending" })
              ],
              spacing: { after: 200 }
            }),

            // Outcome
            new Paragraph({
              children: [
                new TextRun({
                  text: "OUTCOME & IMPACT",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: log.outcome || "Outcome to be documented" })
              ],
              spacing: { after: 200 }
            }),

            // Attachments section
            ...(log.images && log.images.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ATTACHMENTS",
                    bold: true,
                    size: 24,
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `This log contains ${log.images.length} attachment(s). Please refer to the original log for visual content.` 
                  })
                ],
                spacing: { after: 200 }
              })
            ] : []),

            // Author Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "AUTHOR INFORMATION",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Report Generated by: ", bold: true }),
                new TextRun({ text: currentUser?.user_metadata?.full_name || currentUser?.email || 'Current User' })
              ],
              spacing: { after: 100 }
            }),

            ...(currentUser?.email ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Generator Email: ", bold: true }),
                  new TextRun({ text: currentUser.email })
                ],
                spacing: { after: 100 }
              })
            ] : []),

            new Paragraph({
              children: [
                new TextRun({ text: "Report Generation Date: ", bold: true }),
                new TextRun({ text: formatDate(new Date().toISOString()) })
              ],
              spacing: { after: 100 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Export Platform: ", bold: true }),
                new TextRun({ text: "Technical Log Management System" })
              ],
              spacing: { after: 200 }
            })
          ]
        }]
      })

      // Generate and download the document
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `technical-log-${log.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Log Exported",
        description: "The technical log has been exported as a Word document (.docx).",
      })
    } catch (error) {
      console.error("Error exporting log:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export the log. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {searchQuery || filterSystem !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating a new technical log"}
          </p>
          <Link href="/dashboard/technical-logs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Log
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="card-hover overflow-hidden">
              <CardHeader className="pb-3">                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/dashboard/technical-logs/${log.id}`}>
                      <CardTitle className="line-clamp-1 hover:text-primary cursor-pointer">{log.title}</CardTitle>
                    </Link>
                    <CardDescription className="line-clamp-1 mt-1">{log.system}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/technical-logs/${log.id}`}>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/dashboard/technical-logs/${log.id}/edit`}>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => exportToWord(log)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export to Word
                      </DropdownMenuItem>                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(log)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{log.description}</p>
              </CardContent>              <CardFooter className="border-t bg-muted/30 p-3">
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {log.tags &&
                        log.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      {log.tags && log.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{log.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>                  {log.images && log.images.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <div className="text-xs font-medium mb-1.5">Attachments:</div>
                      <div className="flex flex-row mx-2 space-x-6">
                        {log.images.slice(0, 3).map((imageUrl: string, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-muted/60 transition-colors cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                            title="Click to view attachment"
                          >
                            <FilePreview
                              fileName={`${index + 1}`}
                              fileUrl={imageUrl}
                              fileType="image/jpeg"
                              className="h-5 w-5"
                            />
                            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                             {index + 1}
                            </span>
                          </div>
                        ))}
                        {log.images.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-2 pt-0.5">
                            +{log.images.length - 3} more attachments
                          </div>
                        )}
                      </div>
                    </div>
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
            <DialogTitle>Delete Technical Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{logToDelete?.title}"? This action cannot be undone.
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
              onClick={handleDeleteLog}
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
