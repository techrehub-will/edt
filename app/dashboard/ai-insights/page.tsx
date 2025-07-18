import { AIInsightsPanel } from "@/components/ai/ai-insights-panel"

// Force dynamic rendering since this page uses server-side data
export const dynamic = 'force-dynamic'

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of your development patterns and personalized recommendations
        </p>
      </div>
      <AIInsightsPanel />
    </div>
  )
}
