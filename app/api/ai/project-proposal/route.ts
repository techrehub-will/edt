import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title, objective, system, userContext } = await request.json()

    // Validate required fields
    if (!title || !objective || !system) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required fields: title, objective, and system are required" 
        }, 
        { status: 400 }
      )
    }

    // Check if we have a valid Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: "AI service is not configured. Please contact your administrator." 
        }, 
        { status: 503 }
      )
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `
      As an AI assistant for engineering project proposals, create a comprehensive project proposal:

      Title: "${title}"
      Objective: "${objective}"
      System: "${system}"
      User Context: ${JSON.stringify(userContext || {})}

      Generate a detailed project proposal in JSON format:
      {
        "proposal": {
          "executiveSummary": "Brief overview of the project",
          "problemStatement": "Clear definition of the problem",
          "proposedSolution": "Detailed solution approach",
          "scope": {
            "included": ["item 1", "item 2"],
            "excluded": ["item 1", "item 2"]
          },
          "timeline": {
            "phases": [
              {
                "name": "Phase 1",
                "duration": "2 weeks",
                "deliverables": ["deliverable 1", "deliverable 2"]
              }
            ],
            "totalDuration": "8 weeks"
          },
          "resources": {
            "personnel": ["role 1", "role 2"],
            "equipment": ["equipment 1", "equipment 2"],
            "materials": ["material 1", "material 2"]
          },
          "riskAssessment": [
            {
              "risk": "Risk description",
              "probability": "Low/Medium/High",
              "impact": "Low/Medium/High",
              "mitigation": "Mitigation strategy"
            }
          ],
          "successCriteria": ["criteria 1", "criteria 2"],
          "budget": {
            "estimated": "Cost estimate",
            "breakdown": ["item 1: cost", "item 2: cost"]
          }
        },
        "recommendations": ["recommendation 1", "recommendation 2"],
        "nextSteps": ["step 1", "step 2"]
      }

      Focus on engineering best practices, safety considerations, and practical implementation.
      Make the proposal professional and suitable for management review.
      Ensure all arrays have at least 2-3 items and provide realistic timelines and costs.
      `

      const result = await model.generateContent(prompt)
      
      if (!result || !result.response) {
        throw new Error("No response received from AI service")
      }

      const response = await result.response
      const text = response.text()

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI service")
      }

      let proposal
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error("No valid JSON found in AI response")
        }
        
        proposal = JSON.parse(jsonMatch[0])
        
        // Validate the proposal structure
        if (!proposal.proposal || !proposal.recommendations || !proposal.nextSteps) {
          throw new Error("Invalid proposal structure returned from AI")
        }

      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to process AI response. Please try again." 
          }, 
          { status: 502 }
        )
      }

      return NextResponse.json({
        success: true,
        proposal,
        mode: "ai",
      })

    } catch (aiError: any) {
      console.error("AI generation error:", aiError)
      
      // Provide specific error messages based on error type
      let errorMessage = "AI service is temporarily unavailable. Please try again later."
      
      if (aiError.message?.includes("API key")) {
        errorMessage = "AI service authentication failed. Please contact your administrator."
      } else if (aiError.message?.includes("quota") || aiError.message?.includes("limit")) {
        errorMessage = "AI service quota exceeded. Please try again later or contact your administrator."
      } else if (aiError.message?.includes("network") || aiError.message?.includes("connection")) {
        errorMessage = "Network error accessing AI service. Please check your connection and try again."
      }

      return NextResponse.json(
        { 
          success: false,
          error: errorMessage 
        }, 
        { status: 503 }
      )
    }

  } catch (error: any) {
    console.error("Error generating project proposal:", error)
    
    // Handle different types of errors
    if (error.name === "SyntaxError") {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid request format. Please check your input and try again." 
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "An unexpected error occurred. Please try again later." 
      }, 
      { status: 500 }
    )
  }
}
