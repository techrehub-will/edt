"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, ExternalLink, FileText, ImageIcon, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  className?: string
}

export function FilePreview({ fileName, fileUrl, fileType, fileSize, className }: FilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-4 w-4" />

    if (type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    } else if (type === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const canPreview = (type?: string) => {
    if (!type) return false
    return type.startsWith("image/") || type === "application/pdf"
  }

  const renderPreview = () => {
    if (!fileType) return null

    if (fileType.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          {!imageError ? (
            <img
              src={fileUrl || "/placeholder.svg"}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p>Unable to load image</p>
            </div>
          )}
        </div>
      )
    }

    if (fileType === "application/pdf") {
      return (
        <div className="w-full h-[70vh]">
          <iframe src={fileUrl} className="w-full h-full rounded-lg border" title={fileName} />
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <FileText className="h-12 w-12 mb-2" />
        <p>Preview not available for this file type</p>
        <Button variant="outline" className="mt-4" onClick={() => window.open(fileUrl, "_blank")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in new tab
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("flex items-center gap-2 h-auto p-2", className)}>
          {getFileIcon(fileType)}
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
            {fileSize && <span className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</span>}
          </div>
          {canPreview(fileType) && <Eye className="h-3 w-3 ml-auto" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(fileType)}
              <span className="truncate">{fileName}</span>
              {fileType && (
                <Badge variant="outline" className="text-xs">
                  {fileType.split("/")[1]?.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a")
                  link.href = fileUrl
                  link.download = fileName
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  )
}
