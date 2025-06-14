'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Brain, 
  Database, 
  Globe, 
  ExternalLink,
  Lightbulb,
  Target,
  FileText,
  Wrench,
  History,
  X
} from 'lucide-react'
import ChatManager from './chat-manager'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  dataReferences?: DataReference[]
  contextUsed?: {
    goalsCount: number
    technicalLogsCount: number
    projectsCount: number
    includeInternet: boolean
  }
}

interface DataReference {
  type: 'goal' | 'technical_log' | 'project'
  id: string
  title: string
  relevance: string
}

interface AICopilotProps {
  demoMode?: boolean
}

export default function AICopilot({ demoMode = false }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [includeInternet, setIncludeInternet] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showChatManager, setShowChatManager] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  useEffect(() => {
    // Create initial session on component mount
    if (!currentSessionId) {
      createNewSession()
    }
  }, [])

  const createNewSession = async () => {
    try {
      if (demoMode) {
        // In demo mode, just create a local session without API call
        setCurrentSessionId('demo-session')
        setMessages([{
          id: '1',
          type: 'assistant',
          content: "Hi! I'm your AI Engineering Copilot demo. I can answer general engineering questions and show you how the AI assistant works. Sign up to access personalized insights from your own engineering data and projects!",
          timestamp: new Date()
        }])
        return
      }

      const response = await fetch('/api/ai/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Chat'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(data.session.id)
        setMessages([{
          id: '1',
          type: 'assistant',
          content: "Hi! I'm your AI Engineering Copilot. I can help you understand your engineering data, provide insights on your projects, and answer questions about your goals and technical logs. What would you like to know?",
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error creating session:', error)
      // Fallback to demo mode if session creation fails
      setCurrentSessionId('demo-session')
      setMessages([{
        id: '1',
        type: 'assistant',
        content: "Hi! I'm your AI Engineering Copilot. I can answer general engineering questions. For personalized insights from your engineering data, please sign up!",
        timestamp: new Date()
      }])
    }
  }

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true)
    try {
      const response = await fetch(`/api/ai/chat-sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentSessionId(sessionId)
        
        // Convert stored messages to component format
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.message_type,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          dataReferences: msg.metadata?.dataReferences,
          contextUsed: msg.metadata?.contextUsed
        }))

        // If no messages, add welcome message
        if (loadedMessages.length === 0) {
          loadedMessages.push({
            id: '1',
            type: 'assistant',
            content: "Hi! I'm your AI Engineering Copilot. I can help you understand your engineering data, provide insights on your projects, and answer questions about your goals and technical logs. What would you like to know?",
            timestamp: new Date()
          })
        }

        setMessages(loadedMessages)
        setShowChatManager(false)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoadingSession(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentQuestion.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setCurrentQuestion('')

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: currentQuestion,
          includeInternet,
          sessionId: currentSessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        dataReferences: data.dataReferences,
        contextUsed: data.contextUsed
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getDataReferenceIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-3 w-3" />
      case 'technical_log': return <FileText className="h-3 w-3" />
      case 'project': return <Wrench className="h-3 w-3" />
      default: return <Database className="h-3 w-3" />
    }
  }
  const getDataReferenceColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      case 'technical_log': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
      case 'project': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const quickQuestions = [
    "What are my most important goals this month?",    "Show me patterns in my technical issues",
    "How are my projects progressing?",
    "What skills should I focus on developing?",
    "Analyze my engineering productivity trends",
    "What are common themes in my technical logs?"
  ]
  return (
    <div className={`flex ${demoMode ? 'h-[800px]' : 'h-[calc(100vh-4rem)]'} max-w-7xl mx-auto p-4 gap-4`}>
      {/* Chat Manager Sidebar */}
      {showChatManager && !demoMode && (
        <div className="w-80 flex-shrink-0">
          <ChatManager
            onSelectSession={loadSession}
            currentSessionId={currentSessionId || undefined}
            onNewChat={() => {
              createNewSession()
              setShowChatManager(false)
            }}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    AI Engineering Copilot {demoMode && "(Demo)"}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {demoMode 
                      ? "Experience our AI assistant with general engineering questions"
                      : "Ask questions about your engineering data and get personalized insights"
                    }
                  </CardDescription>
                </div>
              </div>
              {!demoMode && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChatManager(!showChatManager)}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Chat History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewSession}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {isLoadingSession ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-gray-600 dark:text-gray-400">Loading chat...</span>
              </div>
            </CardContent>
          ) : (          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}          <ScrollArea className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white shadow-md dark:bg-blue-500'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                    }`}
                  >                    <ScrollArea className="w-full">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap pr-4">
                        {message.content}
                      </div>
                    </ScrollArea>{/* Data References */}
                    {message.dataReferences && message.dataReferences.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Referenced data:</div>                        <ScrollArea className="w-full">
                          <div className="flex flex-wrap gap-1 pr-4">
                            {message.dataReferences.map((ref, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className={`text-xs border ${getDataReferenceColor(ref.type)}`}
                              >
                                {getDataReferenceIcon(ref.type)}
                                <span className="ml-1">{ref.title}</span>
                              </Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                      {/* Context Used */}
                    {message.contextUsed && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Database className="h-3 w-3" />
                            <span>
                              {message.contextUsed.goalsCount} goals, {message.contextUsed.technicalLogsCount} logs, {message.contextUsed.projectsCount} projects
                            </span>
                          </div>
                          {message.contextUsed.includeInternet && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>Internet knowledge</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                      <div className="text-xs opacity-60 mt-2 text-right">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
                {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[80%] shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className={`p-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700`}>
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick questions to get started:</span>
              </div>
              <ScrollArea className={`${demoMode ? 'max-h-32' : 'max-h-48'} w-full`}>
                <div className={`grid ${demoMode ? 'grid-cols-1 gap-1' : 'grid-cols-1 md:grid-cols-2 gap-2'} pr-4`}>
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={`text-left ${demoMode ? 'text-xs h-auto p-2' : 'text-xs h-auto p-3'} justify-start hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300`}
                      onClick={() => setCurrentQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}{/* Input Area */}
          <div className={`${demoMode ? 'p-3' : 'p-4'} border-t bg-white dark:bg-gray-900 dark:border-gray-700`}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInternet"
                  checked={includeInternet}
                  onCheckedChange={(checked) => setIncludeInternet(checked as boolean)}
                />
                <Label htmlFor="includeInternet" className="text-sm text-gray-700 dark:text-gray-300">
                  Include internet knowledge
                </Label>
                <Globe className="h-3 w-3 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="flex space-x-2">
                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder={demoMode ? "Ask me anything about engineering..." : "Ask me anything about your engineering data..."}
                  className={`flex-1 ${demoMode ? 'min-h-[50px]' : 'min-h-[60px]'} resize-none border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !currentQuestion.trim()}
                  className="self-end bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </div>
            </form>
          </div>
        </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
