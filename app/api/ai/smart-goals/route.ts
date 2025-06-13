import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { description, category, currentGoals } = await request.json()

    // Check if we have a valid Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return generateDemoGoalSuggestions(description, category)
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `
      As an AI assistant for engineering development, help create SMART goals based on this input:

      Description: "${description}"
      Category: "${category}"
      Current Goals: ${JSON.stringify(currentGoals || [])}

      Generate a response in JSON format with this structure:
      {
        "suggestions": {
          "title": "Improved SMART goal title",
          "description": "Enhanced SMART description (Specific, Measurable, Achievable, Relevant, Time-bound)",
          "milestones": ["milestone 1", "milestone 2", "milestone 3"],
          "timeline": "suggested timeline",
          "resources": ["resource 1", "resource 2"],
          "successMetrics": ["metric 1", "metric 2"]
        },
        "alternatives": [
          {
            "title": "Alternative goal title",
            "description": "Alternative SMART description",
            "timeline": "timeline"
          }
        ],
        "tips": ["tip 1", "tip 2", "tip 3"]
      }

      Focus on engineering development, technical skills, and professional growth.
      Make goals specific to ${category} category.
      Ensure goals are realistic for engineering professionals.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      let suggestions
      try {
        suggestions = JSON.parse(text)
      } catch (parseError) {
        return generateDemoGoalSuggestions(description, category)
      }

      return NextResponse.json({
        success: true,
        suggestions,
        mode: "ai",
      })
    } catch (aiError) {
      console.log("AI generation error, using fallback:", aiError)
      return generateDemoGoalSuggestions(description, category)
    }
  } catch (error) {
    console.error("Error generating smart goals:", error)
    return NextResponse.json({ error: "Failed to generate goal suggestions" }, { status: 500 })
  }
}

function generateDemoGoalSuggestions(description: string, category: string) {
  const suggestions = {
    title: `Master ${category} Skills Through Practical Application`,
    description: `Develop comprehensive ${category.toLowerCase()} expertise by completing hands-on projects, documenting learnings, and achieving measurable technical milestones within 3 months.`,
    milestones: [
      `Complete foundational ${category.toLowerCase()} training course`,
      `Apply skills to real-world project or problem`,
      `Document and share learnings with team`,
      `Achieve certification or formal recognition`,
    ],
    timeline: "3 months with weekly progress reviews",
    resources: [
      "Online training platforms and courses",
      "Technical documentation and manuals",
      "Mentorship from senior engineers",
      "Hands-on practice opportunities",
    ],
    successMetrics: [
      "Completion of training modules (100%)",
      "Successful project implementation",
      "Positive feedback from supervisor",
      "Improved technical assessment scores",
    ],
  }

  const alternatives = [
    {
      title: `${category} Certification Achievement`,
      description: `Obtain industry-recognized ${category.toLowerCase()} certification through structured learning and practical application.`,
      timeline: "6 months with monthly milestones",
    },
    {
      title: `${category} Process Improvement Initiative`,
      description: `Lead a process improvement project that applies ${category.toLowerCase()} principles to enhance operational efficiency.`,
      timeline: "4 months from planning to implementation",
    },
  ]

  const tips = [
    "Break large goals into smaller, weekly actionable tasks",
    "Set up regular check-ins with your supervisor or mentor",
    "Document your progress and learnings in technical logs",
    "Connect your goal to real workplace challenges or opportunities",
    "Celebrate small wins to maintain motivation",
  ]

  return NextResponse.json({
    success: true,
    suggestions: { suggestions, alternatives, tips },
    mode: "demo",
  })
}
