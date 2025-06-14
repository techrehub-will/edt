"use client"

import { useState, useEffect } from "react"
import { Brain, TrendingUp, Lightbulb, BarChart3, Target, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AIInsight {
  id?: string
  type: "prediction" | "trend" | "suggestion" | "pattern"
  title: string
  description: string
  confidence: number
  priority: "low" | "medium" | "high"
  category: string
  actionable: boolean
  created_at?: string
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Please sign in to view AI insights")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      setInsights(data || [])
    } catch (error) {
      console.error("Error fetching insights:", error)
      setError("Failed to load insights. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate insights")
      }

      // Refresh insights from database
      await fetchInsights()
      
      // Show success message if needed
      if (result.message) {
        // You could add a toast notification here if available
        console.log(result.message)
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      setError(error instanceof Error ? error.message : "Failed to generate insights")
    } finally {
      setGenerating(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="h-4 w-4" />
      case "trend":
        return <BarChart3 className="h-4 w-4" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4" />
      case "pattern":
        return <Target className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      default:
        return "secondary"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const groupedInsights = insights.reduce(
    (acc, insight) => {
      if (!acc[insight.type]) acc[insight.type] = []
      acc[insight.type].push(insight)
      return acc
    },
    {} as Record<string, AIInsight[]>,
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading insights...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your development patterns and personalized recommendations
            </CardDescription>
          </div>
          <Button onClick={generateInsights} disabled={generating} size="sm">
            {generating ? "Generating..." : "Generate New"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No insights available yet. Generate your first AI analysis based on your goals, projects, and technical logs!
            </p>
            <Button onClick={generateInsights} disabled={generating}>
              {generating ? "Generating..." : "Generate AI Insights"}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="prediction">Predictions</TabsTrigger>
              <TabsTrigger value="trend">Trends</TabsTrigger>
              <TabsTrigger value="suggestion">Suggestions</TabsTrigger>
              <TabsTrigger value="pattern">Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {insights.map((insight, index) => (
                <InsightCard key={insight.id || index} insight={insight} />
              ))}
            </TabsContent>

            {Object.entries(groupedInsights).map(([type, typeInsights]) => (
              <TabsContent key={type} value={type} className="space-y-4 mt-4">
                {typeInsights.map((insight, index) => (
                  <InsightCard key={insight.id || index} insight={insight} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="h-4 w-4" />
      case "trend":
        return <BarChart3 className="h-4 w-4" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4" />
      case "pattern":
        return <Target className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      default:
        return "secondary"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getInsightIcon(insight.type)}
            <h4 className="font-medium">{insight.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(insight.priority)}>{insight.priority}</Badge>
            {insight.actionable && <Badge variant="outline">Actionable</Badge>}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                {insight.confidence}%
              </span>
              <Progress value={insight.confidence} className="w-16 h-2" />
            </div>
            <Badge variant="outline" className="text-xs">
              {insight.category}
            </Badge>
          </div>          <span className="text-xs text-muted-foreground">
            {insight.created_at ? new Date(insight.created_at).toLocaleDateString() : "Recent"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
