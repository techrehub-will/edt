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
  const [mode, setMode] = useState<"ai" | "demo" | "unknown">("unknown")
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
        // Load demo insights
        setInsights(getDemoInsights())
        setMode("demo")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.log("Database error, using demo insights:", error)
        setInsights(getDemoInsights())
        setMode("demo")
      } else {
        setInsights(data || [])
        setMode(data && data.length > 0 ? "ai" : "demo")
      }
    } catch (error) {
      console.error("Error fetching insights:", error)
      setInsights(getDemoInsights())
      setMode("demo")
      setError("Using demo mode - database connection unavailable")
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

      // If demo mode returned insights directly, use them
      if (result.mode === "demo" && result.data) {
        setInsights(result.data)
        setMode("demo")
      } else {
        // Refresh insights from database
        await fetchInsights()
        setMode(result.mode || "ai")
      }

      if (result.mode === "demo") {
        setError("Demo mode - AI insights generated without external API")
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      setError(error instanceof Error ? error.message : "Failed to generate insights")
      // Fallback to demo insights
      setInsights(getDemoInsights())
      setMode("demo")
    } finally {
      setGenerating(false)
    }
  }

  const getDemoInsights = (): AIInsight[] => [
    {
      type: "trend",
      title: "Development Activity Pattern",
      description:
        "Based on typical engineering development patterns, you're showing consistent engagement with technical problem-solving. Consider documenting more of your daily troubleshooting activities to build a comprehensive knowledge base.",
      confidence: 85,
      priority: "medium",
      category: "Development",
      actionable: true,
    },
    {
      type: "suggestion",
      title: "Goal Setting Optimization",
      description:
        "Engineering professionals typically achieve better outcomes with SMART goals that include specific technical milestones. Consider breaking larger objectives into weekly technical tasks.",
      confidence: 90,
      priority: "high",
      category: "Goals",
      actionable: true,
    },
    {
      type: "prediction",
      title: "Skill Development Trajectory",
      description:
        "Your focus on system troubleshooting suggests strong diagnostic skills are developing. This foundation typically leads to expertise in preventive maintenance and system optimization within 6-12 months.",
      confidence: 75,
      priority: "medium",
      category: "Technical",
      actionable: false,
    },
    {
      type: "pattern",
      title: "Learning Style Analysis",
      description:
        "Engineers who actively track their problem-solving activities typically retain 40% more technical knowledge. Your systematic approach to documentation indicates strong analytical learning preferences.",
      confidence: 80,
      priority: "low",
      category: "Development",
      actionable: true,
    },
  ]

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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
              {mode === "demo" && <Badge variant="outline">Demo Mode</Badge>}
            </CardTitle>
            <CardDescription>
              {mode === "demo"
                ? "Demo insights based on typical engineering development patterns"
                : "AI-powered analysis of your development patterns and suggestions"}
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
        )}

        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No insights available yet. Generate your first AI analysis!
            </p>
            <Button onClick={generateInsights} disabled={generating}>
              {generating ? "Generating..." : "Generate Insights"}
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
          </div>
          <span className="text-xs text-muted-foreground">
            {insight.created_at ? new Date(insight.created_at).toLocaleDateString() : "Demo"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
