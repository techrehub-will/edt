import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const { title, description, system, resolution, outcome } = body;

    if (!title || !description || !system) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Title, description, and system are required",
        },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Configuration error",
          details: "Gemini API key is not configured",
        },
        { status: 500 }
      );
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analyze this technical log entry and suggest relevant tags for categorization and searchability.
        
        Technical Log Entry:
        Title: ${title}
        System: ${system}
        Description: ${description}
        Resolution: ${resolution || ""}
        Outcome: ${outcome || ""}

        Generate a response in JSON format with this structure:
        {
          "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
          "categories": {
            "technical": ["technical-tags"],
            "process": ["process-tags"],
            "equipment": ["equipment-tags"],
            "skills": ["skill-tags"]
          },
          "priority": ["most-important-tags"],
          "reasoning": "Brief explanation of why these tags are recommended"
        }

        Rules:
        1. Return only the JSON object, no other text
        2. Keep tags concise and hyphenated
        3. Include 4-6 suggested tags
        4. Include 2-3 priority tags
        5. Categorize all tags appropriately
        6. Provide clear reasoning for the tag selection
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse and validate the response
      let tagSuggestions;
      try {
        // Clean up the response text by removing markdown formatting
        const cleanText = text.replace(/```json\n?/, "").replace(/```\n?$/, "").trim();
        tagSuggestions = JSON.parse(cleanText);

        // Validate the structure of the response
        if (!tagSuggestions.suggestedTags || !tagSuggestions.categories || !tagSuggestions.priority || !tagSuggestions.reasoning) {
          throw new Error("Invalid response structure");
        }

        // Validate categories structure
        if (!tagSuggestions.categories.technical || !tagSuggestions.categories.process || 
            !tagSuggestions.categories.equipment || !tagSuggestions.categories.skills) {
          throw new Error("Invalid categories structure");
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        return NextResponse.json(
          {
            error: "AI processing error",
            details: "Failed to process AI response",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        tagSuggestions,
      });
    } catch (aiError) {
      console.error("Error with AI service:", aiError);
      return NextResponse.json(
        {
          error: "AI service error",
          details: aiError instanceof Error ? aiError.message : "Failed to generate tags",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in smart tags generation:", error);
    
    // Determine the appropriate error response
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}
