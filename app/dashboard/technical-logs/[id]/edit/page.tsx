"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Loader2, ExternalLink } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { FileUpload } from "@/components/ui/file-upload"
import { v4 as uuidv4 } from "uuid"
import { SmartTagAssistant } from "@/components/ai/smart-tag-assistant"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  system: z.string().min(1, {
    message: "Please select a system.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  resolution: z.string().min(10, {
    message: "Resolution must be at least 10 characters.",
  }),
  outcome: z.string().min(5, {
    message: "Outcome must be at least 5 characters.",
  }),
  tags: z.array(z.string()).optional(),
})

export default function EditLogPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [log, setLog] = useState<any>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      system: "",
      description: "",
      resolution: "",
      outcome: "",
      tags: [],
    },
  })

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const { data, error } = await supabase.from("technical_logs").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          setLog(data)
          setTags(data.tags || [])
          setExistingFiles(data.images || [])
          form.reset({
            title: data.title,
            system: data.system,
            description: data.description,
            resolution: data.resolution,
            outcome: data.outcome,
            tags: data.tags || [],
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch log",
          variant: "destructive",
        })
        router.push("/dashboard/technical-logs")
      } finally {
        setIsFetching(false)
      }
    }

    fetchLog()
  }, [params.id, supabase, toast, router, form])

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue("tags", newTags)
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    form.setValue("tags", newTags)
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles([...selectedFiles, ...files])
  }

  const handleFileRemoved = (fileIndex: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(fileIndex, 1)
    setSelectedFiles(newFiles)
  }

  const removeExistingFile = (fileUrl: string) => {
    setExistingFiles(existingFiles.filter((url) => url !== fileUrl))
  }

  async function uploadFiles(userId: string) {
    if (selectedFiles.length === 0) return []

    const uploadedUrls: string[] = []
    let progress = 0
    const increment = 100 / selectedFiles.length

    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${uuidv4()}.${fileExt}`
      const filePath = `technical_logs/${fileName}`

      const { error: uploadError, data } = await supabase.storage.from("attachments").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)

      progress += increment
      setUploadProgress(Math.min(Math.round(progress), 100))
    }

    return uploadedUrls
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setUploadProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update a log",
          variant: "destructive",
        })
        return
      }

      // Upload new files first
      let newImageUrls: string[] = []
      if (selectedFiles.length > 0) {
        toast({
          title: "Uploading files",
          description: "Please wait while your files are being uploaded...",
        })

        newImageUrls = await uploadFiles(user.id)
      }

      // Combine existing and new files
      const allImages = [...existingFiles, ...newImageUrls]

      // Update the log entry with the file URLs
      const { error } = await supabase
        .from("technical_logs")
        .update({
          title: values.title,
          system: values.system,
          description: values.description,
          resolution: values.resolution,
          outcome: values.outcome,
          tags: values.tags || [],
          images: allImages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Log updated",
        description: "Your technical log has been updated successfully.",
      })

      router.push("/dashboard/technical-logs")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading log...</p>
        </div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold">Log not found</h2>
        <p className="mt-2 text-muted-foreground">The log you're looking for doesn't exist or you don't have access.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/technical-logs")}>
          Back to Logs
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-t-4 border-t-emerald-500">
        <CardHeader>
          <CardTitle>Edit Technical Log</CardTitle>
          <CardDescription>Update your technical issue documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Title</FormLabel>
                    <FormControl>
                      <Input placeholder="SCADA Communication Failure" {...field} />
                    </FormControl>
                    <FormDescription>A clear, concise title for the technical issue</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a system" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PLC">PLC</SelectItem>
                        <SelectItem value="SCADA">SCADA</SelectItem>
                        <SelectItem value="Hydraulics">Hydraulics</SelectItem>
                        <SelectItem value="Pneumatics">Pneumatics</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Solar">Solar</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The system or area affected by the issue</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fault Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the technical issue in detail" className="min-h-24" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of the issue, including symptoms and context
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Steps</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe how you resolved the issue" className="min-h-24" {...field} />
                    </FormControl>
                    <FormDescription>Document the steps you took to resolve the issue</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the result of your resolution" className="min-h-20" {...field} />
                    </FormControl>
                    <FormDescription>Describe the outcome and any lessons learned</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2 hover:bg-transparent hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove tag</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button type="button" variant="secondary" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                    <FormDescription>Add relevant tags to help categorize this log</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Tag Assistant - placed outside FormField */}
              <SmartTagAssistant
                title={form.watch("title") || ""}
                description={form.watch("description") || ""}
                system={form.watch("system") || ""}
                resolution={form.watch("resolution") || ""}
                outcome={form.watch("outcome") || ""}
                currentTags={tags}
                onTagsChange={(newTags) => {
                  setTags(newTags)
                  form.setValue("tags", newTags)
                }}
              />

              <div className="space-y-4">
                <div>
                  <FormLabel>Current Attachments</FormLabel>
                  {existingFiles.length > 0 ? (
                    <div className="mt-2 space-y-2 rounded-md border p-4">
                      {existingFiles.map((fileUrl, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                            >
                              <span className="truncate">Attachment {index + 1}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeExistingFile(fileUrl)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No attachments</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FormLabel>Add New Attachments</FormLabel>
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    onFileRemoved={handleFileRemoved}
                    selectedFiles={selectedFiles}
                    accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx"
                    multiple={true}
                    maxFiles={5}
                  />
                  <FormDescription>
                    Upload images, schematics, diagrams, or other relevant files (max 5 files, 10MB each)
                  </FormDescription>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                  {isLoading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Updating...") : "Update Log"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
