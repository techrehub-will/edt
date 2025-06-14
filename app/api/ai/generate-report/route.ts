import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { userInput, reportType = 'technical_log' } = await request.json()

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      )
    }    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt = ''
    
    if (reportType === 'technical_log') {
      prompt = `
As an expert technical documentation assistant, analyze the following user input and generate a structured technical log report. 

User Input: "${userInput}"

Please provide a JSON response with the following structure:
{
  "title": "A clear, concise title for the technical log (max 100 characters)",
  "system": "The system/technology involved (e.g., 'Web Application', 'Mobile App', 'API', 'Database', 'Infrastructure', 'Security', 'DevOps', 'Frontend', 'Backend', 'Cloud Services', 'PLC', 'SCADA', 'Hydraulics', 'Pneumatics', 'Electrical', 'Mechanical', 'Solar', 'Other')",
  "description": "A detailed description of the problem, issue, or technical challenge encountered (2-3 paragraphs)",
  "resolution": "Step-by-step explanation of how the issue was resolved or the solution implemented (include technical details, commands, code snippets if relevant)",
  "outcome": "The result of the resolution, lessons learned, and any follow-up actions needed",
  "suggestedTags": ["array", "of", "relevant", "technical", "tags"]
}

Guidelines:
- Keep the title professional and descriptive
- Choose the most appropriate system category
- Make the description clear and technical but accessible
- Provide actionable resolution steps
- Include specific outcomes and learnings
- Suggest 3-7 relevant tags for categorization
- If the input is vague, make reasonable technical assumptions
- Focus on engineering best practices and problem-solving

Return only valid JSON without any markdown formatting or additional text.`
    } else {
      return NextResponse.json(
        { error: 'Unsupported report type' },
        { status: 400 }
      )
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const generatedReport = JSON.parse(cleanedText)

      // Validate the response has required fields
      const requiredFields = ['title', 'system', 'description', 'resolution', 'outcome']
      const missingFields = requiredFields.filter(field => !generatedReport[field])
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      return NextResponse.json({
        success: true,
        report: generatedReport
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', text)
      
      return NextResponse.json(
        { 
          error: 'Failed to generate structured report',
          details: 'The AI response could not be parsed. Please try rephrasing your input.'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Gemini AI API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
