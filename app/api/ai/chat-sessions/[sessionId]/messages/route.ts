import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const { messageType, content, metadata } = await request.json()

    if (!messageType || !content) {
      return NextResponse.json(
        { error: 'Message type and content are required' },
        { status: 400 }
      )
    }

    if (!['user', 'assistant'].includes(messageType)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      )    }

    const supabase = await createServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Create new message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: messageType,
        content,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chat message:', error)
      return NextResponse.json(
        { error: 'Failed to create chat message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Create chat message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
