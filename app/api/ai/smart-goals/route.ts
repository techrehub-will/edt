import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const { description, category, currentGoals } = body

    if (!description || !category) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          details: "Description and category are required" 
        }, 
        { status: 400 }
      )
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Gemini API key is not configured" 
        }, 
        { status: 500 }
      )
    }

    // Initialize Gemini
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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

    // Generate content with Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()    // Parse and validate the response
    let suggestions
    try {
      // Clean up the response text by removing markdown formatting
      const cleanText = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim()
      suggestions = JSON.parse(cleanText)
      
      // Validate the structure of the response
      if (!suggestions.suggestions || !suggestions.alternatives || !suggestions.tips) {
        throw new Error("Invalid response structure")
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
      return NextResponse.json(
        { 
          error: "AI processing error", 
          details: "Failed to process AI response" 
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      suggestions,
      mode: "ai"
    })

  } catch (error) {
    console.error("Error in smart goals generation:", error)
    
    // Determine the appropriate error response
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: "Invalid request", 
          details: "Invalid JSON in request body" 
        }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: "An unexpected error occurred while processing your request" 
      }, 
      { status: 500 }
    )
  }
}
