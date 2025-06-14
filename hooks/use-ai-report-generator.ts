"use client"

import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface GenerateReportOptions {
  userInput: string
  reportType?: 'technical_log' | 'project_report' | 'goal_update'
}

interface GeneratedReport {
  title: string
  system?: string
  description: string
  resolution?: string
  outcome: string
  suggestedTags?: string[]
  [key: string]: any
}

export function useAIReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<GeneratedReport | null>(null)
  const { toast } = useToast()

  const generateReport = useCallback(async ({ userInput, reportType = 'technical_log' }: GenerateReportOptions): Promise<GeneratedReport | null> => {
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide a description to generate a report.",
        variant: "destructive",
      })
      return null
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
          reportType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report')
      }

      if (data.success && data.report) {
        setLastGenerated(data.report)
        toast({
          title: "Report Generated!",
          description: "AI has successfully generated your report.",
        })
        return data.report
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
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [toast])

  const clearLastGenerated = useCallback(() => {
    setLastGenerated(null)
  }, [])

  return {
    generateReport,
    isGenerating,
    lastGenerated,
    clearLastGenerated
  }
}
