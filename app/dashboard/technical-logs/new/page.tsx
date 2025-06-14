"use client"

import { useState } from "react"
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
import { useForm } from "react-hook-form"
import * as z from "zod"
import { FileUpload } from "@/components/ui/file-upload"
import { v4 as uuidv4 } from "uuid"
import { SmartTagAssistant } from "@/components/ai/smart-tag-assistant"
import { AIReportGenerator } from "@/components/ai/ai-report-generator"

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
  attachments: z.any().optional(),
})

export default function NewLogPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
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
      attachments: undefined,
    },
  })

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
    }    return uploadedUrls
  }

  const handleAIReportGenerated = (report: any) => {
    // Fill form fields with AI-generated content
    form.setValue("title", report.title)
    form.setValue("system", report.system)
    form.setValue("description", report.description)
    form.setValue("resolution", report.resolution)
    form.setValue("outcome", report.outcome)
    
    // Add suggested tags if any
    if (report.suggestedTags && Array.isArray(report.suggestedTags)) {
      const newTags = [...tags, ...report.suggestedTags.filter((tag: string) => !tags.includes(tag))]
      setTags(newTags)
      form.setValue("tags", newTags)
    }
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
          description: "You must be logged in to create a log",
          variant: "destructive",
        })
        return
      }

      // Upload files first
      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        toast({
          title: "Uploading files",
          description: "Please wait while your files are being uploaded...",
        })

        imageUrls = await uploadFiles(user.id)
      }

      // Then create the log entry with the file URLs
      const { error } = await supabase.from("technical_logs").insert({
        user_id: user.id,
        title: values.title,
        system: values.system,
        description: values.description,
        resolution: values.resolution,
        outcome: values.outcome,
        tags: values.tags || [],
        images: imageUrls,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Log created",
        description: "Your technical log has been created successfully.",
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
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* AI Report Generator */}
      <AIReportGenerator 
        onReportGenerated={handleAIReportGenerated}
        isLoading={isLoading}
      />

      {/* Manual Form */}
      <Card className="border-t-4 border-t-emerald-500">
        <CardHeader>
          <CardTitle>Create Technical Log</CardTitle>
          <CardDescription>Document a technical issue you've resolved</CardDescription>
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
                      </FormControl>                      <SelectContent>
                        <SelectItem value="Web Application">Web Application</SelectItem>
                        <SelectItem value="Mobile App">Mobile App</SelectItem>
                        <SelectItem value="API">API</SelectItem>
                        <SelectItem value="Database">Database</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Frontend">Frontend</SelectItem>
                        <SelectItem value="Backend">Backend</SelectItem>
                        <SelectItem value="Cloud Services">Cloud Services</SelectItem>
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

              <FormField
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachments</FormLabel>
                    <FormControl>
                      <FileUpload
                        onFilesSelected={handleFilesSelected}
                        onFileRemoved={handleFileRemoved}
                        selectedFiles={selectedFiles}
                        accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx"
                        multiple={true}
                        maxFiles={5}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload images, schematics, diagrams, or other relevant files (max 5 files, 10MB each)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                  {isLoading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Creating...") : "Create Log"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
