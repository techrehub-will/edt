"use client"

import { useState, useEffect } from "react"
import { Zap, Database, Cpu, Building2, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Integration {
  id: string
  name: string
  type: "scada" | "cmms" | "plc" | "erp" | "historian"
  status: "connected" | "disconnected" | "error" | "testing"
  endpoint: string
  last_sync: string | null
  error_message: string | null
  data_points: number
  created_at: string
}

interface IntegrationLog {
  id: string
  integration_id: string
  action: string
  status: "success" | "error"
  message: string
  created_at: string
}

export function IntegrationDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchIntegrations()
    fetchLogs()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error("Error fetching integrations:", error)
    }
  }

  const fetchLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("integration_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (integrationId: string, type: string) => {
    setTesting(integrationId)
    try {
      const response = await fetch(`/api/integrations/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", integrationId }),
      })

      if (!response.ok) throw new Error("Test failed")

      await fetchIntegrations()
      await fetchLogs()
    } catch (error) {
      console.error("Error testing connection:", error)
    } finally {
      setTesting(null)
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "scada":
        return <Activity className="h-5 w-5" />
      case "cmms":
        return <Building2 className="h-5 w-5" />
      case "plc":
        return <Cpu className="h-5 w-5" />
      case "erp":
        return <Database className="h-5 w-5" />
      case "historian":
        return <Database className="h-5 w-5" />
      default:
        return <Zap className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "testing":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "testing":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const connectedCount = integrations.filter((i) => i.status === "connected").length
  const totalDataPoints = integrations.reduce((sum, i) => sum + i.data_points, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">of {integrations.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDataPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total synchronized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m</div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Integrations Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your engineering systems to start tracking data automatically.
                  </p>
                  <Button>Add Integration</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIntegrationIcon(integration.type)}
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {integration.type.toUpperCase()} Integration
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <Badge variant={getStatusColor(integration.status)}>{integration.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Endpoint:</span>
                        <span className="font-mono text-xs">{integration.endpoint}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Data Points:</span>
                        <span>{integration.data_points.toLocaleString()}</span>
                      </div>
                      {integration.last_sync && (
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span>{new Date(integration.last_sync).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {integration.error_message && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{integration.error_message}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(integration.id, integration.type)}
                        disabled={testing === integration.id}
                      >
                        {testing === integration.id ? "Testing..." : "Test Connection"}
                      </Button>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Recent integration activity and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No activity logs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {log.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{log.action}</span>
                          <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
