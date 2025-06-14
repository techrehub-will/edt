import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Internal server error: Supabase client not initialized" }, { status: 500 })
    }

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis is currently unavailable. Gemini API key is not configured." },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { reportType, dateRange, startDate, endDate, userData } = body

    // Validate input
    if (!userData) {
      return NextResponse.json({ error: "No data provided for analysis" }, { status: 400 })
    }

    const totalItems = userData.goals.length + userData.logs.length + userData.projects.length
    if (totalItems === 0) {
      return NextResponse.json(
        { error: "No data available to analyze. Please add some goals, technical logs, or projects first." },
        { status: 400 },
      )
    }

    // Prepare data for analysis
    const goalsText = userData.goals
      .map(
        (goal: any) =>
          `Goal: ${goal.title}
Category: ${goal.category}
Description: ${goal.description}
Status: ${goal.status}`,
      )
      .join("\n\n")

    const logsText = userData.logs
      .map(
        (log: any) =>
          `Log: ${log.title}
System: ${log.system}
Description: ${log.description}
Resolution: ${log.resolution}
Outcome: ${log.outcome}
Tags: ${(log.tags || []).join(", ")}`,
      )
      .join("\n\n")

    const projectsText = userData.projects
      .map(
        (project: any) =>
          `Project: ${project.title}
System: ${project.system}
Objective: ${project.objective}
Status: ${project.status}
Results: ${project.results || "N/A"}`,
      )
      .join("\n\n")

    // Function to call Gemini API
    async function callGeminiAPI(prompt: string) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    }

    // Extract skills using Gemini
    const skillsPrompt = `
      Based on the following engineering development data, identify the technical skills demonstrated by the engineer. 
      For each skill, determine the level (beginner, intermediate, advanced) and categorize it (e.g., PLC Programming, SCADA Systems, Electrical Engineering,Programming, Software Development ,etc etc.).
      
      GOALS:
      ${goalsText || "No goals data available."}
      
      TECHNICAL LOGS:
      ${logsText || "No technical logs available."}
      
      PROJECTS:
      ${projectsText || "No projects data available."}
      
      Return the results as a JSON array of objects with the following structure:
      [
        {
          "name": "skill name",
          "level": "beginner|intermediate|advanced",
          "category": "skill category"
        }
      ]
      
      Only include the JSON array in your response, nothing else. Limit to maximum 10 skills.
      Base skill levels on complexity and frequency of work shown in the data.
    `

    const skillsResponse = await callGeminiAPI(skillsPrompt)

    // Parse skills response
    let extractedSkills: any[] = []
    try {
      const cleanedResponse = skillsResponse.trim().replace(/```json\n?|\n?```/g, "")
      extractedSkills = JSON.parse(cleanedResponse)
      if (!Array.isArray(extractedSkills)) {
        throw new Error("Invalid skills format")
      }
    } catch (parseError) {
      console.error("Skills parsing error:", parseError)
      console.error("Raw response:", skillsResponse)
      return NextResponse.json({ error: "Failed to parse AI response for skills analysis" }, { status: 500 })
    }

    // Generate suggestions using Gemini
    const suggestionsPrompt = `
      Based on the following engineering development data and identified skills, suggest 3-5 specific learning opportunities or projects that would help the engineer grow professionally.
      
      GOALS:
      ${goalsText || "No goals data available."}
      
      TECHNICAL LOGS:
      ${logsText || "No technical logs available."}
      
      PROJECTS:
      ${projectsText || "No projects data available."}
      
      IDENTIFIED SKILLS:
      ${extractedSkills.map((skill) => `${skill.name} (${skill.level})`).join(", ")}
      
      Return the results as a JSON array of objects with the following structure:
      [
        {
          "title": "suggestion title",
          "description": "detailed description of the suggestion",
          "relevance": "why this is relevant to the engineer's growth",
          "priority": "high|medium|low"
        }
      ]
      
      Only include the JSON array in your response, nothing else. Limit to maximum 5 suggestions.
      Prioritize suggestions that build on existing skills or fill important gaps.
    `

    const suggestionsResponse = await callGeminiAPI(suggestionsPrompt)

    // Parse suggestions response
    let extractedSuggestions: any[] = []
    try {
      const cleanedResponse = suggestionsResponse.trim().replace(/```json\n?|\n?```/g, "")
      extractedSuggestions = JSON.parse(cleanedResponse)
      if (!Array.isArray(extractedSuggestions)) {
        throw new Error("Invalid suggestions format")
      }
    } catch (parseError) {
      console.error("Suggestions parsing error:", parseError)
      console.error("Raw response:", suggestionsResponse)
      return NextResponse.json({ error: "Failed to parse AI response for suggestions analysis" }, { status: 500 })
    }

    // Store analysis in database
    const analysisData = {
      user_id: user.id,
      report_type: reportType,
      date_range: dateRange,
      start_date: startDate || null,
      end_date: endDate || null,
      skills: extractedSkills,
      suggestions: extractedSuggestions,
      data_summary: {
        goals_count: userData.goals.length,
        logs_count: userData.logs.length,
        projects_count: userData.projects.length,
      },
    }

    if (!supabase) {
      console.error("Supabase client is null")
      return NextResponse.json({ error: "Internal server error: Supabase client not initialized" }, { status: 500 })
    }

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("skills_analysis")
      .insert(analysisData)
      .select()
      .single()

    if (saveError) {
      console.error("Database save error:", saveError)
      return NextResponse.json({ error: "Failed to save analysis to database" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedAnalysis.id,
        analysis_date: savedAnalysis.analysis_date,
        skills: extractedSkills,
        suggestions: extractedSuggestions,
        data_summary: analysisData.data_summary,
      },
    })
  } catch (error: any) {
    console.error("Skills analysis error:", error)
    return NextResponse.json({ error: error.message || "Failed to analyze skills" }, { status: 500 })
  }
}
