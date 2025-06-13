import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's data to generate smart notifications
    const [goalsResult, logsResult, projectsResult] = await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("technical_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("improvement_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])

    const goals = goalsResult.data || []
    const logs = logsResult.data || []
    const projects = projectsResult.data || []

    const notifications = []

    // Check for overdue goals
    const overdueGoals = goals.filter((goal) => {
      if (!goal.deadline || goal.status === "completed") return false
      return new Date(goal.deadline) < new Date()
    })

    for (const goal of overdueGoals) {
      notifications.push({
        user_id: user.id,
        title: "Goal Overdue",
        message: `Your goal "${goal.title}" is past its deadline. Consider updating the timeline or marking it complete.`,
        type: "warning",
        priority: "high",
        action_url: `/dashboard/goals/${goal.id}/edit`,
      })
    }

    // Check for stalled projects
    const stalledProjects = projects.filter(
      (project) =>
        project.status === "ongoing" && new Date(project.updated_at) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    )

    for (const project of stalledProjects) {
      notifications.push({
        user_id: user.id,
        title: "Project Needs Update",
        message: `Project "${project.title}" hasn't been updated in 2 weeks. Consider adding a progress update.`,
        type: "info",
        priority: "medium",
        action_url: `/dashboard/projects/${project.id}/edit`,
      })
    }

    // Check for achievements
    const recentCompletedGoals = goals.filter(
      (goal) =>
        goal.status === "completed" && new Date(goal.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    )

    for (const goal of recentCompletedGoals) {
      notifications.push({
        user_id: user.id,
        title: "Goal Completed! 🎉",
        message: `Congratulations on completing "${goal.title}"! Consider setting a new challenge.`,
        type: "success",
        priority: "medium",
        action_url: "/dashboard/goals/new",
      })
    }

    // Check for inactive periods
    const lastLogDate = logs[0]?.created_at
    if (lastLogDate && new Date(lastLogDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      notifications.push({
        user_id: user.id,
        title: "Time to Log Your Work",
        message:
          "You haven't logged any technical work in a week. Document your recent activities to track your progress.",
        type: "info",
        priority: "low",
        action_url: "/dashboard/technical-logs/new",
      })
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications)

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      generated: notifications.length,
      message: `Generated ${notifications.length} smart notifications`,
    })
  } catch (error) {
    console.error("Error generating notifications:", error)
    return NextResponse.json({ error: "Failed to generate notifications" }, { status: 500 })
  }
}
