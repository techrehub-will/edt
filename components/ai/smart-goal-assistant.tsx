"use client"

import { useState } from "react"
import { Lightbulb, Target, Clock, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SmartGoalSuggestions {
  suggestions: {
    title: string
    description: string
    milestones: string[]
    timeline: string
    resources: string[]
    successMetrics: string[]
  }
  alternatives: Array<{
    title: string
    description: string
    timeline: string
  }>
  tips: string[]
}

interface SmartGoalAssistantProps {
  category: string
  currentGoals?: any[]
  onApplySuggestion: (suggestion: any) => void
}

export function SmartGoalAssistant({ category, currentGoals = [], onApplySuggestion }: SmartGoalAssistantProps) {
  const [description, setDescription] = useState("")
  const [suggestions, setSuggestions] = useState<SmartGoalSuggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ai" | "demo">("demo")

  const generateSuggestions = async () => {
    if (!description.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/ai/smart-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          currentGoals,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSuggestions(result.suggestions)
        setMode(result.mode)
      }
    } catch (error) {
      console.error("Error generating suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = (suggestion: any) => {
    onApplySuggestion({
      title: suggestion.title,
      description: suggestion.description,
      category,
      status: "Not Started",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          AI Goal Assistant
          {mode === "demo" && <Badge variant="outline">Demo Mode</Badge>}
        </CardTitle>
        <CardDescription>Get AI-powered suggestions to create SMART goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Describe your goal idea:</label>
          <Textarea
            placeholder={`I want to improve my ${category.toLowerCase()} skills by...`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20"
          />
          <Button onClick={generateSuggestions} disabled={loading || !description.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {suggestions && (
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">Main Suggestion</TabsTrigger>
              <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">{suggestions.suggestions.title}</CardTitle>
                  <CardDescription>{suggestions.suggestions.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Milestones
                    </h4>
                    <ul className="space-y-1">
                      {suggestions.suggestions.milestones.map((milestone, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timeline
                    </h4>
                    <p className="text-sm text-muted-foreground">{suggestions.suggestions.timeline}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Resources Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.suggestions.resources.map((resource, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Success Metrics</h4>
                    <ul className="space-y-1">
                      {suggestions.suggestions.successMetrics.map((metric, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button onClick={() => applySuggestion(suggestions.suggestions)} className="w-full">
                    Apply This Goal
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alternatives" className="space-y-4">
              {suggestions.alternatives.map((alt, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{alt.title}</CardTitle>
                    <CardDescription>{alt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">{alt.timeline}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => applySuggestion(alt)}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI Tips for Goal Success:</strong>
                </AlertDescription>
              </Alert>
              {suggestions.tips.map((tip, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <p className="text-sm">{tip}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
