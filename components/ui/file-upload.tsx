"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload, ImageIcon, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFileRemoved: (fileIndex: number) => void
  selectedFiles: File[]
  accept?: string
  multiple?: boolean
  maxFiles?: number
  className?: string
}

export function FileUpload({
  onFilesSelected,
  onFileRemoved,
  selectedFiles,
  accept = "image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx",
  multiple = true,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const totalFiles = selectedFiles.length + newFiles.length

      if (totalFiles > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`)
        return
      }

      onFilesSelected(newFiles)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const totalFiles = selectedFiles.length + newFiles.length

      if (totalFiles > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`)
        return
      }

      onFilesSelected(newFiles)

      // Reset the input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getFileIcon = (file: File) => {
    const fileType = file.type

    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />
    } else if (fileType === "application/pdf") {
      return <File className="h-5 w-5 text-red-500" />
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      return <File className="h-5 w-5 text-blue-600" />
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel"
    ) {
      return <File className="h-5 w-5 text-green-600" />
    } else {
      return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          className,
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">Drag and drop files here or</p>
        <Button type="button" variant="outline" onClick={handleButtonClick}>
          Browse Files
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Supported formats: Images, PDFs, CAD files, and documents (max {maxFiles} files)
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </p>
          <div className="max-h-60 overflow-y-auto rounded-md border">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between border-b p-2 last:border-0"
              >
                <div className="flex items-center space-x-2 truncate">
                  {getFileIcon(file)}
                  <div className="truncate">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onFileRemoved(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
