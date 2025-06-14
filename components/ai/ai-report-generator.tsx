"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Sparkles, FileText, ArrowRight, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GeneratedReport {
  title: string
  system: string
  description: string
  resolution: string
  outcome: string
  suggestedTags?: string[]
}

interface AIReportGeneratorProps {
  onReportGenerated: (report: GeneratedReport) => void
  isLoading?: boolean
}

export function AIReportGenerator({ onReportGenerated, isLoading: parentLoading = false }: AIReportGeneratorProps) {
  const [userInput, setUserInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe your technical issue or solution.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: userInput.trim(),
          reportType: 'technical_log'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report')
      }

      if (data.success && data.report) {
        setGeneratedReport(data.report)
        toast({
          title: "Report Generated!",
          description: "AI has successfully generated your technical log. Review and use it below.",
        })
      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('Report generation error:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseReport = () => {
    if (generatedReport) {
      onReportGenerated(generatedReport)
      toast({
        title: "Report Applied",
        description: "The generated content has been applied to your form.",
      })
    }
  }

  const handleClear = () => {
    setUserInput("")
    setGeneratedReport(null)
  }

  const isLoading = isGenerating || parentLoading

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Report Generator
        </CardTitle>
        <CardDescription>
          Describe your technical issue or solution in natural language, and AI will generate a structured technical log for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-input">Describe your technical issue or solution</Label>
          <Textarea
            id="ai-input"
            placeholder="e.g., 'We had a database connection timeout issue in production. The application was throwing 500 errors and users couldn't log in. I found that the connection pool was exhausted due to a memory leak in our ORM queries. Fixed it by optimizing the queries and increasing pool size.'"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={4}
            disabled={isLoading}
            className="min-h-[100px]"
          />
          <div className="text-sm text-muted-foreground">
            💡 <strong>Tips:</strong> Include details about the problem, what you tried, and how you solved it. The more context you provide, the better the generated report will be.
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={!userInput.trim() || isLoading}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
          
          {(userInput || generatedReport) && (
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          )}
        </div>

        {generatedReport && (
          <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <FileText className="h-4 w-4" />
                Generated Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm mt-1 p-2 bg-white dark:bg-green-900 rounded border">
                  {generatedReport.title}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">System</Label>
                <p className="text-sm mt-1 p-2 bg-white dark:bg-green-900 rounded border">
                  {generatedReport.system}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1 p-2 bg-white dark:bg-green-900 rounded border max-h-20 overflow-y-auto">
                  {generatedReport.description}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Resolution</Label>
                <p className="text-sm mt-1 p-2 bg-white dark:bg-green-900 rounded border max-h-20 overflow-y-auto">
                  {generatedReport.resolution}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Outcome</Label>
                <p className="text-sm mt-1 p-2 bg-white dark:bg-green-900 rounded border max-h-20 overflow-y-auto">
                  {generatedReport.outcome}
                </p>
              </div>

              {generatedReport.suggestedTags && generatedReport.suggestedTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Suggested Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {generatedReport.suggestedTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUseReport}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Use This Report
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Examples of good inputs:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>"Fixed a memory leak in our React components that was causing browser crashes"</li>
                <li>"Resolved API timeout issues by implementing connection pooling and retry logic"</li>
                <li>"Deployed a new microservice architecture to improve system scalability"</li>
                <li>"Implemented OAuth 2.0 authentication to replace legacy session management"</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
