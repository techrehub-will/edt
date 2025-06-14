import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: "AI service unavailable - missing configuration" 
        },
        { status: 503 }
      )
    }

    // Authenticate user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    // Fetch user's data for analysis
    const [goalsResult, logsResult, projectsResult] = await Promise.allSettled([
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("technical_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("improvement_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    const goals = goalsResult.status === "fulfilled" ? goalsResult.value.data || [] : []
    const logs = logsResult.status === "fulfilled" ? logsResult.value.data || [] : []
    const projects = projectsResult.status === "fulfilled" ? projectsResult.value.data || [] : []

    // Prepare comprehensive data analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const recentLogs = logs.filter(l => new Date(l.created_at) > thirtyDaysAgo)
    const weeklyLogs = logs.filter(l => new Date(l.created_at) > sevenDaysAgo)
    
    const dataSummary = {
      user_profile: {
        total_goals: goals.length,
        completed_goals: goals.filter(g => g.status === "completed").length,
        active_goals: goals.filter(g => g.status === "in_progress").length,
        overdue_goals: goals.filter(g => g.due_date && new Date(g.due_date) < new Date() && g.status !== "completed").length,
        total_logs: logs.length,
        recent_logs_30d: recentLogs.length,
        recent_logs_7d: weeklyLogs.length,
        total_projects: projects.length,
        completed_projects: projects.filter(p => p.status === "completed").length,
        active_projects: projects.filter(p => p.status === "in_progress").length,
      },
      technical_patterns: {
        systems_worked_on: [...new Set(logs.map(l => l.system).filter(Boolean))],
        common_tags: getTopItems(logs.flatMap(l => l.tags || []), 10),
        frequent_issues: getTopItems(logs.map(l => l.issue_type).filter(Boolean), 5),
        resolution_methods: getTopItems(logs.map(l => l.resolution_method).filter(Boolean), 5),
      },
      goal_patterns: {
        categories: getTopItems(goals.map(g => g.category).filter(Boolean), 10),
        priorities: goals.reduce((acc, g) => {
          acc[g.priority] = (acc[g.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        completion_rate: goals.length > 0 ? Math.round((goals.filter(g => g.status === "completed").length / goals.length) * 100) : 0,
      },
      productivity_metrics: {
        avg_logs_per_week: recentLogs.length / 4,
        goal_creation_trend: getActivityTrend(goals, thirtyDaysAgo),
        project_completion_trend: getActivityTrend(projects.filter(p => p.status === "completed"), thirtyDaysAgo),
      }
    }

    // Generate AI insights using Gemini
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    })

    const prompt = `
    As an AI assistant specializing in engineering development tracking and professional growth, analyze the following comprehensive data and provide actionable insights:

    USER PROFILE:
    - Goals: ${dataSummary.user_profile.total_goals} total (${dataSummary.user_profile.completed_goals} completed, ${dataSummary.user_profile.active_goals} active, ${dataSummary.user_profile.overdue_goals} overdue)
    - Technical Activity: ${dataSummary.user_profile.total_logs} total logs, ${dataSummary.user_profile.recent_logs_30d} in last 30 days, ${dataSummary.user_profile.recent_logs_7d} in last 7 days
    - Projects: ${dataSummary.user_profile.total_projects} total (${dataSummary.user_profile.completed_projects} completed, ${dataSummary.user_profile.active_projects} active)

    TECHNICAL PATTERNS:
    - Systems: ${dataSummary.technical_patterns.systems_worked_on.slice(0, 10).join(", ")}
    - Common Tags: ${Object.entries(dataSummary.technical_patterns.common_tags).slice(0, 8).map(([tag, count]) => `${tag}(${count})`).join(", ")}
    - Frequent Issues: ${Object.entries(dataSummary.technical_patterns.frequent_issues).slice(0, 5).map(([issue, count]) => `${issue}(${count})`).join(", ")}

    GOAL PATTERNS:
    - Categories: ${Object.entries(dataSummary.goal_patterns.categories).slice(0, 5).map(([cat, count]) => `${cat}(${count})`).join(", ")}
    - Completion Rate: ${dataSummary.goal_patterns.completion_rate}%
    - Priorities: ${Object.entries(dataSummary.goal_patterns.priorities).map(([pri, count]) => `${pri}(${count})`).join(", ")}

    PRODUCTIVITY:
    - Average logs per week: ${dataSummary.productivity_metrics.avg_logs_per_week.toFixed(1)}

    Generate 4-6 specific, actionable insights in valid JSON format:

    {
      "insights": [
        {
          "type": "trend|prediction|suggestion|pattern",
          "title": "Specific, clear title",
          "description": "Detailed analysis with specific recommendations based on the actual data",
          "confidence": 65-95,
          "priority": "low|medium|high",
          "category": "Development|Technical|Goals|Productivity|Skills",
          "actionable": true|false
        }
      ]
    }

    Requirements:
    1. Base insights on ACTUAL data patterns, not generic advice
    2. Include specific numbers and trends from the data
    3. Provide concrete, actionable recommendations
    4. Focus on professional development and engineering skills
    5. Identify both strengths and improvement areas
    6. Consider work-life balance and sustainable practices
    
    Return ONLY the JSON object, no additional text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let parsedInsights
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanText)
      parsedInsights = parsed.insights || []
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: "AI response format error" 
        },
        { status: 500 }
      )
    }

    if (!Array.isArray(parsedInsights) || parsedInsights.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No insights generated" 
        },
        { status: 500 }
      )
    }

    // Validate and clean insights
    const validatedInsights = parsedInsights
      .filter(insight => 
        insight.title && 
        insight.description && 
        insight.type && 
        insight.confidence >= 0 && 
        insight.confidence <= 100
      )
      .map(insight => ({
        user_id: user.id,
        type: insight.type,
        title: insight.title.substring(0, 200), // Limit title length
        description: insight.description.substring(0, 1000), // Limit description length
        confidence: Math.min(100, Math.max(0, Math.round(insight.confidence))),
        priority: ["low", "medium", "high"].includes(insight.priority) ? insight.priority : "medium",
        category: insight.category || "Development",
        actionable: Boolean(insight.actionable),
      }))

    if (validatedInsights.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No valid insights generated" 
        },
        { status: 500 }
      )
    }

    // Store insights in database
    const { error: insertError } = await supabase
      .from("ai_insights")
      .insert(validatedInsights)

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to save insights" 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insights: validatedInsights.length,
      message: `Generated ${validatedInsights.length} AI-powered insights`,
      mode: "ai",
    })

  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getTopItems(items: string[], limit: number): Record<string, number> {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .reduce((acc, [item, count]) => {
      acc[item] = count
      return acc
    }, {} as Record<string, number>)
}

function getActivityTrend(items: any[], since: Date): number {
  return items.filter(item => new Date(item.created_at) > since).length
}
