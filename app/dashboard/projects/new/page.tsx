"use client"

import { useState } from "react"
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
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ProjectProposalGenerator } from "@/components/ai/project-proposal-generator"

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

export default function NewProjectPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      objective: "",
      system: "",
      status: "Planned",
      timeline: "",
      contractor_involved: false,
      results: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a project",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("improvement_projects").insert({
        user_id: user.id,
        title: values.title,
        objective: values.objective,
        system: values.system,
        status: values.status,
        timeline: values.timeline,
        contractor_involved: values.contractor_involved,
        results: values.results || "",
        images: [],
      })

      if (error) {
        throw error
      }

      toast({
        title: "Project created",
        description: "Your improvement project has been created successfully.",
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

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-t-4 border-t-amber-500">
        <CardHeader>
          <CardTitle>Create Improvement Project</CardTitle>
          <CardDescription>Document a Kaizen-style initiative or contractor-managed job</CardDescription>
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
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ProjectProposalGenerator
        title={form.watch("title") || ""}
        objective={form.watch("objective") || ""}
        system={form.watch("system") || ""}
        onProposalGenerated={(proposal) => {
          // Optionally auto-fill some fields from the proposal
          if (proposal.proposal.timeline.totalDuration) {
            form.setValue("timeline", proposal.proposal.timeline.totalDuration)
          }
        }}
      />
    </div>
  )
}
