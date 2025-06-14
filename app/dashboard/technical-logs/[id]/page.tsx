"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  FileText, 
  Monitor, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Download,
  Share,
  MoreHorizontal,
  Trash2,
  Eye,
  X,
  ZoomIn
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TechnicalLog {
  id: string
  user_id: string
  title: string
  system: string
  description: string
  resolution: string
  outcome: string
  tags: string[]
  images: string[]
  created_at: string
  updated_at: string
}

export default function TechnicalLogDetail() {
  const router = useRouter()
  const params = useParams()
  const { supabase, isConnected } = useSupabase()
  const { toast } = useToast()
    const [log, setLog] = useState<TechnicalLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [selectedAttachment, setSelectedAttachment] = useState<{url: string, type: 'image' | 'pdf', name: string} | null>(null)

  const logId = params.id as string

  // Helper function to determine file type
  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    const extension = url.toLowerCase().split('.').pop()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image'
    } else if (extension === 'pdf') {
      return 'pdf'
    }
    return 'other'
  }

  const getFileName = (url: string): string => {
    return url.split('/').pop() || 'attachment'
  }

  useEffect(() => {
    if (logId && isConnected) {
      loadLog()
    }
  }, [logId, isConnected])

  const loadLog = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view technical logs.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const { data: logData, error: logError } = await supabase
        .from("technical_logs")
        .select("*")
        .eq("id", logId)
        .eq("user_id", user.id)
        .single()

      if (logError) {
        if (logError.code === "PGRST116") {
          toast({
            title: "Log Not Found",
            description: "The requested technical log could not be found.",
            variant: "destructive",
          })
          router.push("/dashboard/technical-logs")
          return
        }
        throw logError
      }

      setLog(logData)
    } catch (error: any) {
      console.error("Error loading log:", error)
      toast({
        title: "Error Loading Log",
        description: "Failed to load the technical log details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!log) return
    
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
        .eq("id", log.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Log Deleted",
        description: "The technical log has been successfully deleted.",
      })

      router.push("/dashboard/technical-logs")
    } catch (error: any) {
      console.error("Error deleting log:", error)
      toast({
        title: "Error Deleting Log",
        description: error.message || "Failed to delete the technical log.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: log?.title,
          text: log?.description,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "The log link has been copied to your clipboard.",
      })
    }
  }
  const exportLog = async () => {
    if (!log) return

    try {
      // Dynamic import for document generation
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")

      // Create document with professional formatting
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: log.title,
                  bold: true,
                  size: 32,
                })
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            // Metadata section
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
                new TextRun({ text: log.system })
              ],
              spacing: { after: 100 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Created: ", bold: true }),
                new TextRun({ text: format(new Date(log.created_at), "PPpp") })
              ],
              spacing: { after: 100 }
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Last Updated: ", bold: true }),
                new TextRun({ text: format(new Date(log.updated_at), "PPpp") })
              ],
              spacing: { after: 200 }
            }),

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
                new TextRun({ text: log.description })
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
                new TextRun({ text: log.resolution })
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
                new TextRun({ text: log.outcome })
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
            ] : [])
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
      a.download = `technical-log-${log.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`
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
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              <span className="ml-2">Loading technical log...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Log Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested technical log could not be found.
              </p>
              <Button asChild>
                <Link href="/dashboard/technical-logs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/technical-logs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Logs
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportLog}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/technical-logs/${log.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Title and Metadata */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{log.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Monitor className="h-4 w-4" />
                    <span>{log.system}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(log.created_at), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tags */}
        {log.tags && log.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {log.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Problem Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{log.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{log.resolution}</p>
            </div>
          </CardContent>
        </Card>

        {/* Outcome */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Outcome & Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{log.outcome}</p>
            </div>
          </CardContent>
        </Card>        {/* Attachments */}
        {log.images && log.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
              <CardDescription>
                Click on any attachment to view it in full size. Supports images and PDF files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {log.images.map((attachmentUrl, index) => {
                  const fileType = getFileType(attachmentUrl)
                  const fileName = getFileName(attachmentUrl)
                  
                  return (
                    <div 
                      key={index} 
                      className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative"
                      onClick={() => {
                        if (fileType === 'image') {
                          setSelectedImage(attachmentUrl)
                          setImageModalOpen(true)
                        } else if (fileType === 'pdf') {
                          setSelectedAttachment({
                            url: attachmentUrl,
                            type: 'pdf',
                            name: fileName
                          })
                          setImageModalOpen(true)
                        }
                      }}
                    >
                      <div className="relative h-48 flex items-center justify-center bg-gray-50">
                        {fileType === 'image' ? (
                          <>
                            <img 
                              src={attachmentUrl} 
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </>
                        ) : fileType === 'pdf' ? (
                          <>
                            <div className="flex flex-col items-center justify-center text-red-600">
                              <FileText className="h-16 w-16 mb-2" />
                              <span className="text-sm font-medium">PDF Document</span>
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                              <Eye className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FileText className="h-16 w-16 mb-2" />
                            <span className="text-sm font-medium">Document</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-muted-foreground truncate" title={fileName}>
                          {fileName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {fileType === 'other' ? 'Document' : fileType}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Created: {format(new Date(log.created_at), "PPpp")}</p>
              {log.updated_at !== log.created_at && (
                <p>Last updated: {format(new Date(log.updated_at), "PPpp")}</p>
              )}
            </div>
          </CardContent>
        </Card>      </div>      {/* Attachment Viewer Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedAttachment ? 
                  `${selectedAttachment.type === 'pdf' ? 'PDF Viewer' : 'Image Viewer'} - ${selectedAttachment.name}` : 
                  'Attachment Viewer'
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageModalOpen(false)
                  setSelectedImage("")
                  setSelectedAttachment(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
            <div className="flex-1 overflow-hidden">
            {selectedImage && !selectedAttachment && (
              <div className="h-full p-6 overflow-auto">
                <div className="h-full flex items-center justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Full size attachment"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}
            
            {selectedAttachment?.type === 'pdf' && (
              <PDFViewer 
                url={selectedAttachment.url} 
                fileName={selectedAttachment.name}
              />
            )}
          </div>
            <DialogFooter className="p-6 pt-2 border-t bg-gray-50/50">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {selectedAttachment ? 
                  `${selectedAttachment.type === 'pdf' ? 'PDF Document' : 'Image File'} - ${selectedAttachment.name}` :
                  selectedImage ? 'Image File' : ''
                }
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImageModalOpen(false)
                    setSelectedImage("")
                    setSelectedAttachment(null)
                  }}
                >
                  Close
                </Button>
                {!selectedAttachment?.type && selectedImage && (
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = selectedImage
                      link.download = `attachment-${Date.now()}`
                      link.target = '_blank'
                      link.click()
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {selectedAttachment?.type === 'pdf' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      window.open(selectedAttachment.url, '_blank')
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Technical Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this technical log? This action cannot be undone.
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
