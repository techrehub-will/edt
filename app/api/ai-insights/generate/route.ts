import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if we have a valid Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.log("No Gemini API key found, generating demo insights")
      return generateDemoInsights()
    }

    let user
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
    } catch (authError) {
      console.log("Auth error, using demo mode:", authError)
      return generateDemoInsights()
    }

    if (!user) {
      return generateDemoInsights()
    }

    // Try to fetch user's data for analysis
    let goals: any[] = []
    let logs: any[] = []
    let projects: any[] = []

    try {
      const [goalsResult, logsResult, projectsResult] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("technical_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase
          .from("improvement_projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      goals = goalsResult.data || []
      logs = logsResult.data || []
      projects = projectsResult.data || []
    } catch (dbError) {
      console.log("Database error, using demo data:", dbError)
      return generateDemoInsights()
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.status === "completed").length,
      activeGoals: goals.filter((g) => g.status === "in_progress").length,
      totalLogs: logs.length,
      recentLogs: logs.filter((l) => new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      totalProjects: projects.length,
      completedProjects: projects.filter((p) => p.status === "completed").length,
      systemsWorkedOn: [...new Set(logs.map((l) => l.system))],
      commonTags: logs
        .flatMap((l) => l.tags || [])
        .reduce(
          (acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      goalCategories: goals.reduce(
        (acc, goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    // Try to use Gemini AI
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

      // Use the correct model name for the current API
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `
      As an AI assistant for engineering development tracking, analyze the following data and provide insights:

      Data Summary:
      - Total Goals: ${dataSummary.totalGoals} (${dataSummary.completedGoals} completed, ${dataSummary.activeGoals} active)
      - Technical Logs: ${dataSummary.totalLogs} total, ${dataSummary.recentLogs} in last 30 days
      - Projects: ${dataSummary.totalProjects} total, ${dataSummary.completedProjects} completed
      - Systems: ${dataSummary.systemsWorkedOn.join(", ")}
      - Common Tags: ${Object.entries(dataSummary.commonTags)
        .map(([tag, count]) => `${tag}(${count})`)
        .join(", ")}
      - Goal Categories: ${Object.entries(dataSummary.goalCategories)
        .map(([cat, count]) => `${cat}(${count})`)
        .join(", ")}

      Generate 3-5 insights in JSON format with this structure:
      {
        "insights": [
          {
            "type": "prediction|trend|suggestion|pattern",
            "title": "Brief title",
            "description": "Detailed insight description",
            "confidence": 75,
            "priority": "low|medium|high",
            "category": "Development|Technical|Projects|Goals",
            "actionable": true|false
          }
        ]
      }

      Focus on:
      1. Development patterns and trends
      2. Skill gap analysis
      3. Productivity insights
      4. Goal achievement patterns
      5. Technical system expertise
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      let insights
      try {
        const parsed = JSON.parse(text)
        insights = parsed.insights || []
      } catch (parseError) {
        console.log("AI response parsing error, using fallback insights")
        insights = generateFallbackInsights(dataSummary)
      }

      // Try to insert insights into database
      try {
        const insightsToInsert = insights.map((insight: any) => ({
          user_id: user.id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          priority: insight.priority,
          category: insight.category,
          actionable: insight.actionable,
        }))

        await supabase.from("ai_insights").insert(insightsToInsert)
      } catch (insertError) {
        console.log("Database insert error, insights generated but not saved:", insertError)
      }

      return NextResponse.json({
        success: true,
        insights: insights.length,
        message: `Generated ${insights.length} AI insights`,
        mode: "ai",
      })
    } catch (aiError) {
      console.log("AI generation error, using fallback:", aiError)
      const insights = generateFallbackInsights(dataSummary)

      return NextResponse.json({
        success: true,
        insights: insights.length,
        message: `Generated ${insights.length} insights (demo mode)`,
        mode: "demo",
      })
    }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return generateDemoInsights()
  }
}

function generateDemoInsights() {
  const demoInsights = [
    {
      type: "trend",
      title: "Development Activity Pattern",
      description:
        "Based on typical engineering development patterns, you're showing consistent engagement with technical problem-solving. Consider documenting more of your daily troubleshooting activities to build a comprehensive knowledge base.",
      confidence: 85,
      priority: "medium",
      category: "Development",
      actionable: true,
    },
    {
      type: "suggestion",
      title: "Goal Setting Optimization",
      description:
        "Engineering professionals typically achieve better outcomes with SMART goals that include specific technical milestones. Consider breaking larger objectives into weekly technical tasks.",
      confidence: 90,
      priority: "high",
      category: "Goals",
      actionable: true,
    },
    {
      type: "prediction",
      title: "Skill Development Trajectory",
      description:
        "Your focus on system troubleshooting suggests strong diagnostic skills are developing. This foundation typically leads to expertise in preventive maintenance and system optimization within 6-12 months.",
      confidence: 75,
      priority: "medium",
      category: "Technical",
      actionable: false,
    },
    {
      type: "pattern",
      title: "Learning Style Analysis",
      description:
        "Engineers who actively track their problem-solving activities typically retain 40% more technical knowledge. Your systematic approach to documentation indicates strong analytical learning preferences.",
      confidence: 80,
      priority: "low",
      category: "Development",
      actionable: true,
    },
  ]

  return NextResponse.json({
    success: true,
    insights: demoInsights.length,
    message: `Generated ${demoInsights.length} insights (demo mode)`,
    mode: "demo",
    data: demoInsights,
  })
}

function generateFallbackInsights(dataSummary: any) {
  return [
    {
      type: "trend",
      title: "Development Activity Analysis",
      description: `You've logged ${dataSummary.recentLogs} technical activities in the last 30 days, showing ${dataSummary.recentLogs > 10 ? "high" : "moderate"} engagement with hands-on work.`,
      confidence: 85,
      priority: "medium",
      category: "Development",
      actionable: true,
    },
    {
      type: "suggestion",
      title: "Goal Completion Rate",
      description: `Your goal completion rate is ${Math.round((dataSummary.completedGoals / Math.max(dataSummary.totalGoals, 1)) * 100)}%. Consider breaking down larger goals into smaller, achievable milestones.`,
      confidence: 90,
      priority: "high",
      category: "Goals",
      actionable: true,
    },
    {
      type: "pattern",
      title: "System Expertise Development",
      description: `You've worked on ${dataSummary.systemsWorkedOn.length} different systems, showing broad technical exposure. Focus on deepening expertise in your most frequently used systems.`,
      confidence: 75,
      priority: "medium",
      category: "Technical",
      actionable: true,
    },
  ]
}
