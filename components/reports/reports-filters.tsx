"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReportsFiltersProps {
  reportType: string
  setReportType: (value: string) => void
  dateRange: string
  setDateRange: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
}

export function ReportsFilters({
  reportType,
  setReportType,
  dateRange,
  setDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: ReportsFiltersProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <Tabs defaultValue={reportType} className="w-full" onValueChange={setReportType}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Activities</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="logs">Technical Logs</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive report of all your development activities, including goals, technical logs, and
              improvement projects.
            </p>
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a report of your development goals, including progress, completion rates, and status updates.
            </p>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a report of your technical logs, including issues resolved, systems affected, and resolution
              details.
            </p>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a report of your improvement projects, including status, timelines, and outcomes.
            </p>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a PDF report of your AI-analyzed skills and development suggestions based on your activities.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
