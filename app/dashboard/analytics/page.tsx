import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of your engineering development progress and patterns
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
