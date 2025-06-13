"use client"

import { useState } from "react"
import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsFilters } from "@/components/reports/reports-filters"
import { ReportsTable } from "@/components/reports/reports-table"
import { ReportsGenerator } from "@/components/reports/reports-generator"
import { SkillsAnalysis } from "@/components/reports/skills-analysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsPage() {
  const [reportType, setReportType] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [activeTab, setActiveTab] = useState("data")

  return (
    <div className="space-y-6">
      <ReportsHeader />
      <ReportsFilters
        reportType={reportType}
        setReportType={setReportType}
        dateRange={dateRange}
        setDateRange={setDateRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <Tabs defaultValue="data" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Report Data</TabsTrigger>
          <TabsTrigger value="analysis">Skills Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="space-y-6 mt-6">
          <ReportsGenerator reportType={reportType} dateRange={dateRange} startDate={startDate} endDate={endDate} />
          <ReportsTable reportType={reportType} dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="analysis" className="mt-6">
          <SkillsAnalysis reportType={reportType} dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
