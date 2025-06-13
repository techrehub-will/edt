import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title, objective, system, userContext } = await request.json()

    // Check if we have a valid Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return generateDemoProposal(title, objective, system)
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
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      let proposal
      try {
        proposal = JSON.parse(text)
      } catch (parseError) {
        return generateDemoProposal(title, objective, system)
      }

      return NextResponse.json({
        success: true,
        proposal,
        mode: "ai",
      })
    } catch (aiError) {
      console.log("AI generation error, using fallback:", aiError)
      return generateDemoProposal(title, objective, system)
    }
  } catch (error) {
    console.error("Error generating project proposal:", error)
    return NextResponse.json({ error: "Failed to generate project proposal" }, { status: 500 })
  }
}

function generateDemoProposal(title: string, objective: string, system: string) {
  const proposal = {
    proposal: {
      executiveSummary: `This project aims to ${objective.toLowerCase()} through systematic improvement of the ${system} system. The initiative will enhance operational efficiency, reduce downtime, and improve overall system reliability.`,
      problemStatement: `Current ${system} system operations face challenges that impact productivity and efficiency. This project addresses these issues through targeted improvements and optimization strategies.`,
      proposedSolution: `Implement a comprehensive improvement program that includes system analysis, optimization recommendations, and phased implementation of enhancements to the ${system} system.`,
      scope: {
        included: [
          `${system} system analysis and assessment`,
          "Improvement recommendations development",
          "Implementation planning and execution",
          "Performance monitoring and validation",
          "Documentation and knowledge transfer",
        ],
        excluded: [
          "Major equipment replacement (unless specifically required)",
          "Other system modifications outside project scope",
          "Long-term maintenance contracts",
        ],
      },
      timeline: {
        phases: [
          {
            name: "Analysis and Planning",
            duration: "2 weeks",
            deliverables: ["System assessment report", "Improvement recommendations", "Implementation plan"],
          },
          {
            name: "Implementation Phase 1",
            duration: "3 weeks",
            deliverables: ["Initial improvements implemented", "Progress report", "Performance metrics"],
          },
          {
            name: "Implementation Phase 2",
            duration: "2 weeks",
            deliverables: ["Final improvements completed", "System validation", "Documentation"],
          },
          {
            name: "Validation and Handover",
            duration: "1 week",
            deliverables: ["Performance validation", "Final report", "Knowledge transfer"],
          },
        ],
        totalDuration: "8 weeks",
      },
      resources: {
        personnel: ["Project engineer", "System technician", "Safety coordinator"],
        equipment: ["Testing equipment", "Installation tools", "Safety equipment"],
        materials: ["Replacement components", "Consumables", "Documentation materials"],
      },
      riskAssessment: [
        {
          risk: "System downtime during implementation",
          probability: "Medium",
          impact: "Medium",
          mitigation: "Schedule work during planned maintenance windows",
        },
        {
          risk: "Unexpected technical complications",
          probability: "Low",
          impact: "High",
          mitigation: "Thorough pre-implementation analysis and contingency planning",
        },
        {
          risk: "Resource availability constraints",
          probability: "Low",
          impact: "Medium",
          mitigation: "Early resource planning and backup arrangements",
        },
      ],
      successCriteria: [
        "Improved system efficiency by measurable percentage",
        "Reduced unplanned downtime",
        "Enhanced system reliability metrics",
        "Positive stakeholder feedback",
        "Complete documentation and knowledge transfer",
      ],
      budget: {
        estimated: "$15,000 - $25,000",
        breakdown: [
          "Personnel costs: $8,000 - $12,000",
          "Materials and components: $5,000 - $8,000",
          "Equipment and tools: $2,000 - $5,000",
        ],
      },
    },
    recommendations: [
      "Conduct thorough stakeholder consultation before implementation",
      "Establish clear communication channels throughout the project",
      "Implement robust change management procedures",
      "Plan for comprehensive testing and validation",
    ],
    nextSteps: [
      "Obtain management approval for project proposal",
      "Secure necessary resources and budget allocation",
      "Finalize project timeline and resource assignments",
      "Begin detailed system analysis and planning phase",
    ],
  }

  return NextResponse.json({
    success: true,
    proposal,
    mode: "demo",
  })
}
