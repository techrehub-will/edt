"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lightbulb, Award, Brain, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface SkillsAnalysisProps {
  reportType?: string
  dateRange?: string
  startDate?: string
  endDate?: string
}

interface Skill {
  name: string
  level: "beginner" | "intermediate" | "advanced"
  category: string
}

interface Suggestion {
  title: string
  description: string
  relevance: string
  priority: "high" | "medium" | "low"
}

interface AnalysisRecord {
  id: string
  analysis_date: string
  skills: Skill[]
  suggestions: Suggestion[]
  data_summary: {
    goals_count: number
    logs_count: number
    projects_count: number
  }
}

export function SkillsAnalysis({ reportType = "all", dateRange = "all", startDate, endDate }: SkillsAnalysisProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<AnalysisRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserData()
    fetchPreviousAnalyses()
  }, [supabase, reportType, dateRange, startDate, endDate])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Determine date range for the query
      let fromDate: Date | null = null
      let toDate = new Date()

      switch (dateRange) {
        case "week":
          fromDate = new Date()
          fromDate.setDate(fromDate.getDate() - 7)
          break
        case "month":
          fromDate = new Date()
          fromDate.setMonth(fromDate.getMonth() - 1)
          break
        case "quarter":
          fromDate = new Date()
          fromDate.setMonth(fromDate.getMonth() - 3)
          break
        case "year":
          fromDate = new Date()
          fromDate.setFullYear(fromDate.getFullYear() - 1)
          break
        case "custom":
          if (startDate) fromDate = new Date(startDate)
          if (endDate) toDate = new Date(endDate)
          break
        default:
          // All time - no filter
          fromDate = null
      }

      // Fetch data based on report type
      let goalsData: any[] = []
      let logsData: any[] = []
      let projectsData: any[] = []

      if (reportType === "all" || reportType === "goals") {
        const goalsQuery = supabase.from("goals").select("*").eq("user_id", user.id)

        if (fromDate) {
          goalsQuery.gte("created_at", fromDate.toISOString())
        }

        if (toDate) {
          goalsQuery.lte("created_at", toDate.toISOString())
        }

        const { data: goals } = await goalsQuery
        goalsData = goals || []
      }

      if (reportType === "all" || reportType === "logs") {
        const logsQuery = supabase.from("technical_logs").select("*").eq("user_id", user.id)

        if (fromDate) {
          logsQuery.gte("created_at", fromDate.toISOString())
        }

        if (toDate) {
          logsQuery.lte("created_at", toDate.toISOString())
        }

        const { data: logs } = await logsQuery
        logsData = logs || []
      }

      if (reportType === "all" || reportType === "projects") {
        const projectsQuery = supabase.from("improvement_projects").select("*").eq("user_id", user.id)

        if (fromDate) {
          projectsQuery.gte("created_at", fromDate.toISOString())
        }

        if (toDate) {
          projectsQuery.lte("created_at", toDate.toISOString())
        }

        const { data: projects } = await projectsQuery
        projectsData = projects || []
      }

      setUserData({
        goals: goalsData,
        logs: logsData,
        projects: projectsData,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to fetch user data")
    } finally {
      setLoading(false)
    }
  }

  const fetchPreviousAnalyses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: analyses, error } = await supabase
        .from("skills_analysis")
        .select("*")
        .eq("user_id", user.id)
        .eq("report_type", reportType)
        .eq("date_range", dateRange)
        .order("analysis_date", { ascending: false })
        .limit(5)

      if (error) throw error

      const formattedAnalyses = (analyses || []).map((analysis) => ({
        id: analysis.id,
        analysis_date: analysis.analysis_date,
        skills: analysis.skills as Skill[],
        suggestions: analysis.suggestions as Suggestion[],
        data_summary: analysis.data_summary as any,
      }))

      setPreviousAnalyses(formattedAnalyses)

      // Set the most recent analysis as current if available
      if (formattedAnalyses.length > 0) {
        setCurrentAnalysis(formattedAnalyses[0])
      }
    } catch (error) {
      console.error("Error fetching previous analyses:", error)
    }
  }

  const analyzeSkills = async () => {
    if (!userData) return

    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          dateRange,
          startDate,
          endDate,
          userData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze skills")
      }

      if (result.success && result.analysis) {
        const newAnalysis: AnalysisRecord = {
          id: result.analysis.id,
          analysis_date: result.analysis.analysis_date,
          skills: result.analysis.skills,
          suggestions: result.analysis.suggestions,
          data_summary: result.analysis.data_summary,
        }

        setCurrentAnalysis(newAnalysis)
        setPreviousAnalyses([newAnalysis, ...previousAnalyses.slice(0, 4)])

        toast({
          title: "Analysis complete",
          description: `Identified ${result.analysis.skills.length} skills and generated ${result.analysis.suggestions.length} suggestions. Results saved to your profile.`,
        })
      }
    } catch (error: any) {
      console.error("Error analyzing skills:", error)
      setError(error.message || "Failed to analyze skills. Please try again.")
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze skills. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "intermediate":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "advanced":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-500"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            Gemini AI Skills Analysis & Development Suggestions
          </CardTitle>
          <CardDescription>
            Use Google's Gemini AI to analyze your technical logs and projects to identify skills and get personalized
            suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!currentAnalysis && !error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-4 text-center text-muted-foreground">
                Click the button below to run Gemini AI analysis on your data and get personalized skills assessment and
                development suggestions
              </p>
              <Button onClick={analyzeSkills} disabled={analyzing || !userData} size="lg">
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Gemini Analysis...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Run Gemini AI Analysis
                  </>
                )}
              </Button>
              {userData && (
                <p className="text-sm text-muted-foreground mt-2">
                  Will analyze {userData.goals.length} goals, {userData.logs.length} logs, and{" "}
                  {userData.projects.length} projects
                </p>
              )}
            </div>
          ) : currentAnalysis ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Last analyzed: {format(new Date(currentAnalysis.analysis_date), "PPp")} (Powered by Gemini AI)
                  </span>
                </div>
                <Button onClick={analyzeSkills} disabled={analyzing} variant="outline" size="sm">
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Run New Analysis
                    </>
                  )}
                </Button>
              </div>

              {currentAnalysis.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Gemini AI-Identified Skills ({currentAnalysis.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className={getSkillLevelColor(skill.level)}>
                        {skill.name} ({skill.level})
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Skills identified by Gemini AI analysis of your {currentAnalysis.data_summary.goals_count} goals,{" "}
                    {currentAnalysis.data_summary.logs_count} technical logs, and{" "}
                    {currentAnalysis.data_summary.projects_count} projects.
                  </p>
                </div>
              )}

              {currentAnalysis.suggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                    Gemini AI-Generated Development Suggestions ({currentAnalysis.suggestions.length})
                  </h3>
                  <div className="space-y-4">
                    {currentAnalysis.suggestions.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 border-l-4 ${getPriorityColor(suggestion.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                            <p className="text-sm mt-2 italic text-blue-600 dark:text-blue-400">
                              <span className="font-medium">💡 Relevance:</span> {suggestion.relevance}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previousAnalyses.length > 1 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    Previous Analyses
                  </h3>
                  <div className="space-y-2">
                    {previousAnalyses.slice(1).map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{format(new Date(analysis.analysis_date), "PPp")}</p>
                          <p className="text-xs text-muted-foreground">
                            {analysis.skills.length} skills, {analysis.suggestions.length} suggestions
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentAnalysis(analysis)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
