import { IntegrationDashboard } from "@/components/integrations/integration-dashboard"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Integrations</h1>
        <p className="text-muted-foreground">Connect and manage your engineering systems and data sources</p>
      </div>
      <IntegrationDashboard />
    </div>
  )
}
