import { type NextRequest, NextResponse } from "next/server";

/**
 * Extracts a JSON object from a string. It finds the first '{' and the last '}'
 * to safeguard against extra text or markdown wrappers from the AI.
 * @param text The raw string response from the AI.
 * @returns A clean JSON string, or null if a valid object can't be found.
 */
function extractJsonFromString(text: string): string | null {
  const startIndex = text.indexOf("{");
  const endIndex = text.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return null; // No valid JSON object found
  }

  return text.substring(startIndex, endIndex + 1);
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, system, resolution, outcome } = await request.json();

    const content = `
      Title: ${title}
      System: ${system}
      Description: ${description}
      Resolution: ${resolution || ""}
      Outcome: ${outcome || ""}
    `.trim();

    let tagSuggestions;
    let mode = "ai";

    try {
      // Step 1: Call the Google Gemini API
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("The GOOGLE_API_KEY environment variable is not set.");
      }

      const model = "gemini-1.5-flash-latest";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `Analyze this technical log entry and suggest relevant tags for categorization and searchability. Provide your response as a single, valid JSON object without any other text or markdown wrappers. The JSON object must conform to this structure:
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
Content to analyze:
${content}`;

      const apiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Google AI API Error:", errorBody);
        throw new Error(`API request failed with status ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("No text content in AI response. It may have been blocked for safety reasons.");
      }
      
      // Step 2: Clean and parse the response
      const jsonString = extractJsonFromString(rawText);

      if (!jsonString) {
        throw new Error("Could not extract a valid JSON object from the AI response.");
      }

      tagSuggestions = JSON.parse(jsonString);

    } catch (aiError) {
      console.error("AI generation failed, switching to fallback logic:", aiError);
      mode = "demo";
      tagSuggestions = generateFallbackTags(title, description, system, resolution, outcome);
    }

    // Step 3: Successfully return data to the client
    return NextResponse.json({
      success: true,
      tagSuggestions,
      mode,
    });

  } catch (error) {
    // This is the final safety net for any unexpected errors.
    console.error("Critical error in smart-tags API handler:", error);

    const fallbackTags = {
      suggestedTags: ["technical-issue", "troubleshooting", "maintenance", "documentation"],
      categories: {
        technical: ["technical-issue", "system-analysis"],
        process: ["troubleshooting", "maintenance"],
        equipment: ["equipment-failure", "repair"],
        skills: ["problem-solving", "documentation"],
      },
      priority: ["technical-issue", "troubleshooting"],
      reasoning: "A critical error occurred. These are default fallback tags.",
    };

    // Always return a valid JSON response to prevent the client from crashing.
    return NextResponse.json({
      success: true, // Reporting success as we are providing fallback data.
      tagSuggestions: fallbackTags,
      mode: "demo",
    });
  }
}

// This fallback function remains unchanged but is included for completeness.
function generateFallbackTags(
  title: string,
  description: string,
  system: string,
  resolution?: string,
  outcome?: string,
) {
  const allText = `${title} ${description} ${system} ${resolution || ""} ${outcome || ""}`.toLowerCase();

  const systemTags = {
    plc: ["plc", "automation", "control-system"],
    scada: ["scada", "monitoring", "data-acquisition"],
    hydraulics: ["hydraulics", "fluid-power", "pressure-system"],
    pneumatics: ["pneumatics", "compressed-air", "actuators"],
    electrical: ["electrical", "power-system", "wiring"],
    mechanical: ["mechanical", "machinery", "components"],
    solar: ["solar", "renewable-energy", "photovoltaic"],
  };

  const processTags: string[] = [];
  const technicalTags: string[] = [];
  const equipmentTags: string[] = [];
  const skillTags = ["problem-solving", "documentation"];

  const systemKey = system.toLowerCase() as keyof typeof systemTags;
  if (systemTags[systemKey]) {
    technicalTags.push(...systemTags[systemKey]);
  }

  if (allText.includes("repair") || allText.includes("fix")) processTags.push("repair", "maintenance");
  if (allText.includes("troubleshoot") || allText.includes("diagnose")) processTags.push("troubleshooting", "diagnostics");
  if (allText.includes("install") || allText.includes("setup")) processTags.push("installation", "setup");
  if (allText.includes("test") || allText.includes("check")) processTags.push("testing", "inspection");

  if (allText.includes("sensor")) equipmentTags.push("sensors");
  if (allText.includes("motor")) equipmentTags.push("motors");
  if (allText.includes("pump")) equipmentTags.push("pumps");
  if (allText.includes("valve")) equipmentTags.push("valves");
  if (allText.includes("cable") || allText.includes("wire")) equipmentTags.push("wiring");

  // Use Set to remove duplicates before slicing
  const allFoundTags = [...new Set([
    ...technicalTags,
    ...processTags,
    ...equipmentTags,
    ...skillTags,
  ])];
  
  const suggestedTags = allFoundTags.slice(0, 6);

  return {
    suggestedTags,
    categories: {
      technical: [...new Set(technicalTags)],
      process: [...new Set(processTags)],
      equipment: [...new Set(equipmentTags)],
      skills: skillTags,
    },
    priority: suggestedTags.slice(0, 3),
    reasoning: `Tags suggested based on system type (${system}) and keyword analysis.`,
  };
}
