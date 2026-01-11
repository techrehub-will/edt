import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface UserContext {
  goals: any[]
  technicalLogs: any[]
  projects: any[]
  userProfile?: any
}

interface DataReference {
  type: 'goal' | 'technical_log' | 'project'
  id: string
  title: string
  relevance: string
}

export async function POST(request: NextRequest) {
  try {
    const { question, includeInternet = false, sessionId } = await request.json()

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )    }

    const supabase = await createServerClient()
    let currentUser = null

    // Get current user if supabase is available
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUser = user
    }

    // Get user context from database
    const userContext = await getUserContext()
    
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })

    const prompt = buildContextualPrompt(question, userContext, includeInternet)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract relevant data references for citations
    const dataReferences = extractDataReferences(userContext, question)

    const responseData = {
      answer: text,
      dataReferences,
      contextUsed: {
        goalsCount: userContext.goals.length,
        technicalLogsCount: userContext.technicalLogs.length,
        projectsCount: userContext.projects.length,
        includeInternet
      }
    }

    // Save messages to database if user is authenticated and sessionId is provided
    if (supabase && currentUser && sessionId) {
      try {
        // Save user message
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            user_id: currentUser.id,
            message_type: 'user',
            content: question,
            metadata: { includeInternet }
          })

        // Save assistant message
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            user_id: currentUser.id,
            message_type: 'assistant',
            content: text,
            metadata: {
              dataReferences,
              contextUsed: responseData.contextUsed
            }
          })
      } catch (error) {
        console.error('Error saving chat messages:', error)
        // Don't fail the request if saving fails, just log it
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('AI Copilot error:', error)
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    )
  }
}

async function getUserContext(): Promise<UserContext> {  try {
    const supabase = await createServerClient()
    
    if (!supabase) {
      // Return mock data for demo mode
      return {
        goals: [],
        technicalLogs: [],
        projects: []
      }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        goals: [],
        technicalLogs: [],
        projects: []
      }
    }

    // Fetch user's data in parallel
    const [goalsResult, logsResult, projectsResult] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('technical_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('improvement_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    return {
      goals: goalsResult.data || [],
      technicalLogs: logsResult.data || [],
      projects: projectsResult.data || [],
      userProfile: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      }
    }

  } catch (error) {
    console.error('Error fetching user context:', error)
    return {
      goals: [],
      technicalLogs: [],
      projects: []
    }
  }
}

function buildContextualPrompt(question: string, userContext: UserContext, includeInternet: boolean): string {
  const contextSummary = buildContextSummary(userContext)
  
  return `
You are an AI copilot assistant for an Engineering Development Tracker application. Your role is to help users understand their engineering data, provide insights, and answer questions based on their personal engineering journey.

USER'S ENGINEERING CONTEXT:
${contextSummary}

USER QUESTION: "${question}"

INSTRUCTIONS:
1. Analyze the user's question in the context of their engineering data
2. Provide a helpful, personalized response based on their specific situation
3. Reference specific goals, projects, or technical logs when relevant
4. Offer actionable insights and recommendations
5. If the question requires general engineering knowledge${includeInternet ? ' or current information' : ''}, supplement with your knowledge
6. Be conversational but professional
7. If you reference specific user data, mention it clearly (e.g., "Based on your project 'X'...")
8. Suggest follow-up questions or actions when appropriate

${includeInternet ? 'Feel free to include general engineering best practices and current industry knowledge to supplement your answer.' : 'Focus primarily on the user\'s personal data and established engineering principles.'}

Provide a comprehensive but concise response that helps the user make better engineering decisions.
`
}

function buildContextSummary(userContext: UserContext): string {
  const { goals, technicalLogs, projects } = userContext
  
  let summary = "=== USER'S ENGINEERING PROFILE ===\n"
  
  // Goals summary
  if (goals.length > 0) {
    summary += `\nGOALS (${goals.length} total):\n`
    goals.slice(0, 10).forEach((goal, index) => {
      summary += `${index + 1}. ${goal.title} (${goal.category}, ${goal.status})\n`
      if (goal.description) summary += `   Description: ${goal.description.substring(0, 100)}...\n`
    })
  }
  
  // Technical logs summary
  if (technicalLogs.length > 0) {
    summary += `\nTECHNICAL LOGS (${technicalLogs.length} total):\n`
    technicalLogs.slice(0, 10).forEach((log, index) => {
      summary += `${index + 1}. ${log.title} (${log.system})\n`
      summary += `   Problem: ${log.description.substring(0, 100)}...\n`
      summary += `   Resolution: ${log.resolution.substring(0, 100)}...\n`
      if (log.tags && log.tags.length > 0) {
        summary += `   Tags: ${log.tags.join(', ')}\n`
      }
    })
  }
  
  // Projects summary
  if (projects.length > 0) {
    summary += `\nIMPROVEMENT PROJECTS (${projects.length} total):\n`
    projects.slice(0, 10).forEach((project, index) => {
      summary += `${index + 1}. ${project.title} (${project.system}, ${project.status})\n`
      summary += `   Objective: ${project.objective.substring(0, 100)}...\n`
      if (project.results) {
        summary += `   Results: ${project.results.substring(0, 100)}...\n`
      }
    })
  }
  
  if (goals.length === 0 && technicalLogs.length === 0 && projects.length === 0) {
    summary += "\nNo engineering data found. User is likely new to the platform.\n"
  }
  
  return summary
}

function extractDataReferences(userContext: UserContext, question: string): DataReference[] {
  const references: DataReference[] = []
  const questionLower = question.toLowerCase()
  
  // Find relevant goals
  userContext.goals.forEach(goal => {
    if (questionLower.includes(goal.title.toLowerCase()) || 
        questionLower.includes(goal.category.toLowerCase())) {
      references.push({
        type: 'goal',
        id: goal.id,
        title: goal.title,
        relevance: 'mentioned in question'
      })
    }
  })
  
  // Find relevant technical logs
  userContext.technicalLogs.forEach(log => {
    if (questionLower.includes(log.title.toLowerCase()) || 
        questionLower.includes(log.system.toLowerCase()) ||
        (log.tags && log.tags.some((tag: string) => questionLower.includes(tag.toLowerCase())))) {
      references.push({
        type: 'technical_log',
        id: log.id,
        title: log.title,
        relevance: 'related to question topic'
      })
    }
  })
  
  // Find relevant projects
  userContext.projects.forEach(project => {
    if (questionLower.includes(project.title.toLowerCase()) || 
        questionLower.includes(project.system.toLowerCase())) {
      references.push({
        type: 'project',
        id: project.id,
        title: project.title,
        relevance: 'mentioned or related'
      })
    }
  })
  
  return references.slice(0, 10) // Limit to 10 most relevant
}
