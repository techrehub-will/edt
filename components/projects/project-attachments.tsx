"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Paperclip,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface ProjectAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  description?: string
  uploaded_at: string
}

interface ProjectAttachmentsProps {
  projectId: string
  attachments: ProjectAttachment[]
  onAttachmentsUpdate: (attachments: ProjectAttachment[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed'
]

export function ProjectAttachments({ projectId, attachments, onAttachmentsUpdate }: ProjectAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [description, setDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not allowed.`
    }
    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // Validate all files
    for (let i = 0; i < files.length; i++) {
      const error = validateFile(files[i])
      if (error) {
        toast({
          title: "Invalid file",
          description: error,
          variant: "destructive",
        })
        return
      }
    }

    setSelectedFiles(files)
    setShowUploadDialog(true)
  }

  const uploadFiles = async () => {
    if (!selectedFiles) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const uploadedAttachments: ProjectAttachment[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/projects/${projectId}/${fileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save attachment metadata to database
        const { data: attachmentData, error: dbError } = await supabase
          .from('project_attachments')
          .insert({
            project_id: projectId,
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            description: description || null
          })
          .select()
          .single()

        if (dbError) throw dbError

        uploadedAttachments.push(attachmentData)
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      // Update attachments list
      onAttachmentsUpdate([...attachments, ...uploadedAttachments])

      toast({
        title: "Files uploaded",
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      })

      // Reset form
      setSelectedFiles(null)
      setDescription("")
      setShowUploadDialog(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadFile = async (attachment: ProjectAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(attachment.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const deleteAttachment = async (attachment: ProjectAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError

      // Update attachments list
      onAttachmentsUpdate(attachments.filter(a => a.id !== attachment.id))

      toast({
        title: "File deleted",
        description: "Attachment has been removed successfully.",
      })

    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments ({attachments.length})
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
          <Button 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Attachments List */}
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <Card key={attachment.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.file_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => downloadFile(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => deleteAttachment(attachment)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {attachments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No attachments yet. Upload files to document your project.</p>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFiles && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    {getFileIcon(file.type)}
                    <span className="flex-1 text-sm">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for these files..."
                rows={3}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-3 w-3" />
                <span className="font-medium">File Requirements:</span>
              </div>
              <ul className="space-y-1 ml-5">
                <li>• Maximum file size: 10MB</li>
                <li>• Allowed types: Images, PDFs, Documents, Spreadsheets, Text files, ZIP archives</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles}
              disabled={!selectedFiles || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
