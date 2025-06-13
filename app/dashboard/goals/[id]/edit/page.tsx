"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
  deadline: z.date().optional(),
})

export default function EditGoalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [goal, setGoal] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "",
    },
  })

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const { data, error } = await supabase.from("goals").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (data) {
          setGoal(data)
          form.reset({
            title: data.title,
            description: data.description,
            category: data.category,
            status: data.status,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch goal",
          variant: "destructive",
        })
        router.push("/dashboard/goals")
      } finally {
        setIsFetching(false)
      }
    }

    fetchGoal()
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
          description: "You must be logged in to update a goal",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("goals")
        .update({
          title: values.title,
          description: values.description,
          category: values.category,
          status: values.status,
          deadline: values.deadline ? values.deadline.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Goal updated",
        description: "Your development goal has been updated successfully.",
      })

      router.push("/dashboard/goals")
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
          <p className="text-sm text-muted-foreground">Loading goal...</p>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold">Goal not found</h2>
        <p className="mt-2 text-muted-foreground">
          The goal you're looking for doesn't exist or you don't have access.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/goals")}>
          Back to Goals
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle>Edit Development Goal</CardTitle>
          <CardDescription>Update your SMART goal for professional development</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Learn PLC Programming" {...field} />
                    </FormControl>
                    <FormDescription>A clear, concise title for your goal</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Complete the Allen Bradley PLC programming course and apply the knowledge to automate a test bench"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe your goal in detail. Make it Specific, Measurable, Achievable, Relevant, and Time-bound.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Leadership">Leadership</SelectItem>
                          <SelectItem value="Certification">Certification</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Process Improvement">Process Improvement</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The category this goal belongs to</FormDescription>
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
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Stalled">Stalled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The current status of your goal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>The target date for completing this goal</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Updating..." : "Update Goal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
