"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  objective: z.string().min(10, {
    message: "Objective must be at least 10 characters.",
  }),
  system: z.string().min(1, {
    message: "Please select a system.",
  }),
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
  timeline: z.string().min(2, {
    message: "Please provide a timeline.",
  }),
  contractor_involved: z.boolean().default(false),
  results: z.string().optional(),
})

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [project, setProject] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      objective: "",
      system: "",
      status: "",
      timeline: "",
      contractor_involved: false,
      results: "",
    },
  })

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase.from("improvement_projects").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          setProject(data)
          form.reset({
            title: data.title,
            objective: data.objective,
            system: data.system,
            status: data.status,
            timeline: data.timeline,
            contractor_involved: data.contractor_involved,
            results: data.results || "",
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch project",
          variant: "destructive",
        })
        router.push("/dashboard/projects")
      } finally {
        setIsFetching(false)
      }
    }

    fetchProject()
  }, [params.id, supabase, toast, router, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update a project",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("improvement_projects")
        .update({
          title: values.title,
          objective: values.objective,
          system: values.system,
          status: values.status,
          timeline: values.timeline,
          contractor_involved: values.contractor_involved,
          results: values.results || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Project updated",
        description: "Your improvement project has been updated successfully.",
      })

      router.push("/dashboard/projects")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="mt-2 text-muted-foreground">
          The project you're looking for doesn't exist or you don't have access.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Edit Improvement Project</CardTitle>
          <CardDescription>Update your Kaizen-style initiative or contractor-managed job</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Optimize Hydraulic System" {...field} />
                    </FormControl>
                    <FormDescription>A clear, concise title for your improvement project</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective/Justification</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the purpose and justification for this project"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Explain why this project is important and what it aims to achieve</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
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
                      <FormDescription>The system or area involved in this project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The current status of your project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline</FormLabel>
                    <FormControl>
                      <Input placeholder="2 weeks" {...field} />
                    </FormControl>
                    <FormDescription>The expected duration or timeline for this project</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractor_involved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Contractor Involvement</FormLabel>
                      <FormDescription>Does this project involve external contractors?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="results"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Results (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the results or current progress of the project"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Document the outcomes or current progress of the project</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
                  {isLoading ? "Updating..." : "Update Project"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
