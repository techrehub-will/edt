import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

interface ProfileEnhancementData {
  goals: any[]
  logs: any[]
  projects: any[]
  currentProfile: any
  githubData?: any
  linkedinData?: any
}

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

    // Get current profile
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // Fetch user's comprehensive data for enhancement
    const [goalsResult, logsResult, projectsResult] = await Promise.allSettled([
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("technical_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("improvement_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    const goals = goalsResult.status === "fulfilled" ? goalsResult.value.data || [] : []
    const logs = logsResult.status === "fulfilled" ? logsResult.value.data || [] : []
    const projects = projectsResult.status === "fulfilled" ? projectsResult.value.data || [] : []

    // Analyze user data patterns
    const dataAnalysis = analyzeUserData({ goals, logs, projects, currentProfile })

    // Generate enhanced bio and skills using Gemini AI
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const prompt = `
    As a professional profile enhancement AI, create an optimized bio and skills list based on the following comprehensive data:

    CURRENT PROFILE:
    - Name: ${currentProfile?.full_name || "Not provided"}
    - Title: ${currentProfile?.title || "Not provided"}
    - Company: ${currentProfile?.company || "Not provided"}
    - Location: ${currentProfile?.location || "Not provided"}
    - Experience Level: ${currentProfile?.experience_level || "Not provided"}
    - Current Bio: ${currentProfile?.bio || "Not provided"}
    - Current Skills: ${currentProfile?.specializations?.join(", ") || "Not provided"}
    - GitHub: ${currentProfile?.github_url || "Not provided"}
    - LinkedIn: ${currentProfile?.linkedin_url || "Not provided"}

    PROFESSIONAL ACTIVITY ANALYSIS:
    - Technical Systems: ${dataAnalysis.technicalSystems.slice(0, 15).join(", ")}
    - Project Types: ${dataAnalysis.projectTypes.slice(0, 10).join(", ")}
    - Skills Demonstrated: ${dataAnalysis.skillsFromActivity.slice(0, 20).join(", ")}
    - Technologies Used: ${dataAnalysis.technologies.slice(0, 15).join(", ")}
    - Domain Expertise: ${dataAnalysis.domainExpertise.slice(0, 10).join(", ")}
    - Goal Categories: ${dataAnalysis.goalCategories.slice(0, 8).join(", ")}
    - Achievement Pattern: ${dataAnalysis.achievementPattern}
    - Problem-Solving Approach: ${dataAnalysis.problemSolvingApproach}

    PRODUCTIVITY METRICS:
    - Total Projects: ${projects.length} (${projects.filter(p => p.status === "completed").length} completed)
    - Technical Logs: ${logs.length} entries
    - Goals: ${goals.length} (${goals.filter(g => g.status === "completed").length} completed)
    - Recent Activity: ${dataAnalysis.recentActivityLevel}
    - Career Focus: ${dataAnalysis.careerFocus}

    Generate an enhanced professional profile in valid JSON format:

    {
      "enhancedBio": "A compelling 2-3 sentence professional bio that highlights key strengths, experience, and value proposition based on actual activity patterns",
      "enhancedSkills": ["skill1", "skill2", "skill3", "..."],
      "confidence": 75-95,
      "suggestions": [
        "Specific suggestion for profile improvement based on data analysis",
        "Another actionable recommendation"
      ]
    }

    Requirements:
    1. Bio should be professional, concise, and highlight actual demonstrated capabilities
    2. Skills should be ranked by frequency of use and recent activity
    3. Include both technical and soft skills evidenced by the data
    4. Avoid generic statements - use specific insights from the activity data
    5. Maximum 20 skills, prioritized by relevance and demonstration
    6. Bio should be 200-400 characters for optimal readability
    7. Focus on measurable achievements and real expertise areas
    
    Return ONLY the JSON object, no additional text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let enhancement
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
      enhancement = JSON.parse(cleanText)
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

    // Validate the enhancement response
    if (!enhancement.enhancedBio || !Array.isArray(enhancement.enhancedSkills)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid enhancement data generated" 
        },
        { status: 500 }
      )
    }

    // Clean and validate the enhancement data
    const validatedEnhancement = {
      enhancedBio: enhancement.enhancedBio.substring(0, 500),
      enhancedSkills: enhancement.enhancedSkills
        .filter((skill: string) => skill && skill.trim().length > 0)
        .slice(0, 20)
        .map((skill: string) => skill.trim()),
      confidence: Math.min(100, Math.max(0, enhancement.confidence || 80)),
      suggestions: (enhancement.suggestions || [])
        .filter((suggestion: string) => suggestion && suggestion.trim().length > 0)
        .slice(0, 5)
        .map((suggestion: string) => suggestion.trim()),
      dataAnalysis: {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === "completed").length,
        totalLogs: logs.length,
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === "completed").length,
        topSystems: dataAnalysis.technicalSystems.slice(0, 10),
        topSkills: dataAnalysis.skillsFromActivity.slice(0, 15),
      }
    }

    return NextResponse.json({
      success: true,
      enhancement: validatedEnhancement,
      message: "Profile enhancement generated successfully",
    })

  } catch (error) {
    console.error("Error generating profile enhancement:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// Helper function to analyze user data and extract meaningful patterns
function analyzeUserData(data: ProfileEnhancementData) {
  const { goals, logs, projects, currentProfile } = data

  // Extract technical systems from logs
  const technicalSystems = [...new Set(logs.map(log => log.system).filter(Boolean))]
  
  // Extract technologies and skills from tags and descriptions
  const allTags = logs.flatMap(log => log.tags || [])
  const allDescriptions = [...logs.map(log => log.description), ...projects.map(p => p.objective)].join(" ")
  
  // Common tech keywords to identify
  const techKeywords = [
    "React", "Angular", "Vue", "JavaScript", "TypeScript", "Node.js", "Python", "Java", "C#", "Go", "Rust",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "GitLab", "GitHub", "CI/CD",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "REST API", "Microservices",
    "DevOps", "Testing", "Automation", "Monitoring", "Security", "Performance", "Scalability",
    "Machine Learning", "AI", "Data Analysis", "Analytics", "Blockchain", "Mobile", "Frontend", "Backend",
    "Full Stack", "Cloud", "Infrastructure", "Networking", "Database", "API", "Agile", "Scrum",
    "Leadership", "Management", "Architecture", "Design Patterns", "Code Review", "Mentoring"
  ]
  
  const technologies = techKeywords.filter(keyword => 
    allDescriptions.toLowerCase().includes(keyword.toLowerCase()) ||
    allTags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
  )

  // Extract project types
  const projectTypes = [...new Set(projects.map(p => p.system).filter(Boolean))]
  
  // Analyze skills from activity
  const skillsFromActivity = [...new Set([
    ...allTags,
    ...extractSkillsFromText(allDescriptions),
    ...technologies
  ])].filter(skill => skill.length > 2)

  // Extract domain expertise from goal categories
  const goalCategories = [...new Set(goals.map(g => g.category).filter(Boolean))]
  
  // Determine achievement pattern
  const completionRate = goals.length > 0 ? goals.filter(g => g.status === "completed").length / goals.length : 0
  const achievementPattern = completionRate > 0.8 ? "High achiever" : 
                           completionRate > 0.6 ? "Consistent performer" : 
                           completionRate > 0.4 ? "Goal-oriented learner" : "Exploratory approach"

  // Analyze problem-solving approach from logs
  const resolutionMethods = logs.map(log => log.resolution).join(" ").toLowerCase()
  const problemSolvingApproach = resolutionMethods.includes("systematic") ? "Systematic problem solver" :
                                resolutionMethods.includes("collaborative") ? "Collaborative problem solver" :
                                resolutionMethods.includes("research") ? "Research-driven problem solver" :
                                "Pragmatic problem solver"

  // Determine recent activity level
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentActivity = [...logs, ...projects, ...goals].filter(item => 
    new Date(item.created_at) > thirtyDaysAgo
  ).length
  
  const recentActivityLevel = recentActivity > 20 ? "Highly active" :
                             recentActivity > 10 ? "Moderately active" :
                             recentActivity > 5 ? "Selectively active" : "Planning phase"

  // Determine career focus
  const careerFocus = currentProfile?.experience_level === "executive" ? "Strategic leadership" :
                     currentProfile?.experience_level === "lead" ? "Technical leadership" :
                     currentProfile?.experience_level === "senior" ? "Senior expertise" :
                     currentProfile?.experience_level === "mid" ? "Growing expertise" :
                     "Developing skills"

  return {
    technicalSystems,
    technologies,
    skillsFromActivity,
    projectTypes,
    goalCategories,
    domainExpertise: [...new Set([...projectTypes, ...goalCategories, ...technicalSystems])],
    achievementPattern,
    problemSolvingApproach,
    recentActivityLevel,
    careerFocus
  }
}

// Helper function to extract skills from text descriptions
function extractSkillsFromText(text: string): string[] {
  const skillPatterns = [
    /\b(developed|implemented|designed|built|created|deployed|managed|led|optimized|automated|integrated|maintained|troubleshot|debugged|configured|tested|monitored|scaled|architected)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /\busing\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  ]
  
  const extractedSkills: string[] = []
  
  skillPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[2] || match[1]) {
        const skill = (match[2] || match[1]).trim()
        if (skill.length > 2 && skill.length < 30) {
          extractedSkills.push(skill)
        }
      }
    }
  })
  
  return [...new Set(extractedSkills)]
}
