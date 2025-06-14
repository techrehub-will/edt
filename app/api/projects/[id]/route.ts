import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id

    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from("improvement_projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      return NextResponse.json({ error: projectError.message }, { status: 400 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Optionally fetch related data (milestones, tasks, updates)
    const [milestonesResult, tasksResult, updatesResult] = await Promise.allSettled([
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("target_date", { ascending: true }),
      supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
    ])

    const milestones = milestonesResult.status === "fulfilled" ? milestonesResult.value.data || [] : []
    const tasks = tasksResult.status === "fulfilled" ? tasksResult.value.data || [] : []
    const updates = updatesResult.status === "fulfilled" ? updatesResult.value.data || [] : []

    return NextResponse.json({
      project,
      milestones,
      tasks,
      updates
    })
  } catch (error) {
    console.error("Project fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const projectId = params.id

    // Update the project
    const { data, error } = await supabase
      .from("improvement_projects")
      .update(updates)
      .eq("id", projectId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating project:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Project update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
