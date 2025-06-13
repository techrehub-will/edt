"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase-provider"
import { Download, Loader2, FileText } from "lucide-react"
import { format } from "date-fns"
import jsPDF from "jspdf"

interface ReportsGeneratorProps {
  reportType: string
  dateRange: string
  startDate?: string
  endDate?: string
}

export function ReportsGenerator({ reportType, dateRange, startDate, endDate }: ReportsGeneratorProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // Helper function to create section headers
  const addSectionHeader = (pdf: any, text: string, x: number, y: number) => {
    // Add a subtle background
    pdf.setFillColor(240, 240, 250)
    pdf.rect(x - 5, y - 15, pdf.internal.pageSize.getWidth() - 2 * (x - 5), 20, "F")

    // Add section title
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(0, 0, 100) // Dark blue for headers
    pdf.text(text, x, y - 5)
    pdf.setTextColor(0, 0, 0) // Reset to black

    return y + 10
  }

  const generateSkillsPDF = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to generate reports",
          variant: "destructive",
        })
        return
      }

      // Fetch the most recent skills analysis
      const { data: analyses, error } = await supabase
        .from("skills_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("analysis_date", { ascending: false })
        .limit(1)

      if (error) throw error

      if (!analyses || analyses.length === 0) {
        toast({
          title: "No skills analysis found",
          description: "Please run a skills analysis first before generating a PDF report.",
          variant: "destructive",
        })
        return
      }

      const analysis = analyses[0]
      const skills = analysis.skills as any[]
      const suggestions = analysis.suggestions as any[]

      // Create PDF
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
        pdf.setFontSize(fontSize)

        // More aggressive text cleaning
        const cleanText = text
          .replace(/[\r\n\t]+/g, " ") // Replace all whitespace chars with single space
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .replace(/[^\x20-\x7E]/g, "") // Remove non-printable characters
          .trim()

        const lines = pdf.splitTextToSize(cleanText, maxWidth)
        pdf.text(lines, x, y)
        return y + lines.length * (fontSize * 0.5 + 2) // Better line spacing
      }

      // Header
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text("Engineering Skills Analysis Report", 20, yPosition)
      yPosition += 15

      // Subtitle
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`, 20, yPosition)
      yPosition += 10
      pdf.text(`Analysis Date: ${format(new Date(analysis.analysis_date), "MMMM dd, yyyy 'at' HH:mm")}`, 20, yPosition)
      yPosition += 15

      // Data Summary
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("Data Summary", 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      const dataSummary = analysis.data_summary as any
      pdf.text(`• Goals Analyzed: ${dataSummary.goals_count}`, 25, yPosition)
      yPosition += 6
      pdf.text(`• Technical Logs Analyzed: ${dataSummary.logs_count}`, 25, yPosition)
      yPosition += 6
      pdf.text(`• Projects Analyzed: ${dataSummary.projects_count}`, 25, yPosition)
      yPosition += 15

      // Skills Section
      if (skills && skills.length > 0) {
        yPosition = addSectionHeader(pdf, `Identified Skills (${skills.length})`, 20, yPosition)

        // Group skills by category
        const skillsByCategory = skills.reduce((acc: any, skill: any) => {
          if (!acc[skill.category]) {
            acc[skill.category] = []
          }
          acc[skill.category].push(skill)
          return acc
        }, {})

        Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")
          pdf.text(category, 25, yPosition)
          yPosition += 8

          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          categorySkills.forEach((skill: any) => {
            const levelColor =
              skill.level === "advanced" ? [128, 0, 128] : skill.level === "intermediate" ? [0, 128, 0] : [0, 0, 255]
            pdf.setTextColor(...levelColor)
            pdf.text(`• ${skill.name} (${skill.level})`, 30, yPosition)
            pdf.setTextColor(0, 0, 0) // Reset to black
            yPosition += 6
          })
          yPosition += 5
        })

        yPosition += 10
      }

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 20
      }

      // Suggestions Section
      if (suggestions && suggestions.length > 0) {
        yPosition = addSectionHeader(pdf, `Development Suggestions (${suggestions.length})`, 20, yPosition)

        suggestions.forEach((suggestion: any, index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 80) {
            pdf.addPage()
            yPosition = 20
          }

          pdf.setFontSize(12)
          pdf.setFont("helvetica", "bold")

          // Priority indicator
          const priorityColor =
            suggestion.priority === "high"
              ? [255, 0, 0]
              : suggestion.priority === "medium"
                ? [255, 165, 0]
                : [0, 128, 0]
          pdf.setTextColor(...priorityColor)
          pdf.text(`${index + 1}. ${suggestion.title} (${suggestion.priority.toUpperCase()} PRIORITY)`, 25, yPosition)
          pdf.setTextColor(0, 0, 0) // Reset to black
          yPosition += 10

          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          yPosition = addWrappedText(suggestion.description, 30, yPosition, pageWidth - 50, 10)
          yPosition += 5

          // Improved relevance formatting - clean text without background
          pdf.setFontSize(9)
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(60, 60, 60) // Dark gray for better readability

          // Clean the relevance text and ensure proper formatting
          const cleanRelevance = suggestion.relevance.replace(/[\r\n]+/g, " ").trim()
          const relevanceText = `Why this matters: ${cleanRelevance}`

          yPosition = addWrappedText(relevanceText, 30, yPosition, pageWidth - 50, 9)
          pdf.setTextColor(0, 0, 0) // Reset to black
          yPosition += 12
        })
      }

      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Engineering Development Tracker - Skills Analysis Report`, 20, pageHeight - 10)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10)
      }

      // Save the PDF
      const fileName = `skills-analysis-report-${format(new Date(), "yyyy-MM-dd")}.pdf`
      pdf.save(fileName)

      toast({
        title: "Skills report generated",
        description: "Your skills analysis PDF has been generated and downloaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate skills report",
        variant: "destructive",
      })
    }
  }

  const generateCSVReport = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to generate reports",
          variant: "destructive",
        })
        return
      }

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

        const { data: goals, error: goalsError } = await goalsQuery

        if (goalsError) throw goalsError
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

        const { data: logs, error: logsError } = await logsQuery

        if (logsError) throw logsError
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

        const { data: projects, error: projectsError } = await projectsQuery

        if (projectsError) throw projectsError
        projectsData = projects || []
      }

      // Generate CSV content
      let csvContent = ""
      const dateRangeText = fromDate
        ? `${format(fromDate, "yyyy-MM-dd")} to ${format(toDate, "yyyy-MM-dd")}`
        : "All time"

      if (reportType === "all" || reportType === "goals") {
        csvContent += "DEVELOPMENT GOALS\n"
        csvContent += `Date Range: ${dateRangeText}\n\n`
        csvContent += "Title,Category,Status,Deadline,Created At,Description\n"

        goalsData.forEach((goal) => {
          csvContent += `"${goal.title}","${goal.category}","${goal.status}","${goal.deadline || ""}","${
            goal.created_at
          }","${goal.description.replace(/"/g, '""')}"\n`
        })

        csvContent += "\n\n"
      }

      if (reportType === "all" || reportType === "logs") {
        if (reportType === "all") {
          csvContent += "TECHNICAL LOGS\n"
        } else {
          csvContent += "TECHNICAL LOGS\n"
          csvContent += `Date Range: ${dateRangeText}\n\n`
        }

        csvContent += "Title,System,Created At,Tags,Description,Resolution,Outcome\n"

        logsData.forEach((log) => {
          const tags = log.tags ? log.tags.join(", ") : ""
          csvContent += `"${log.title}","${log.system}","${log.created_at}","${tags}","${log.description.replace(
            /"/g,
            '""',
          )}","${log.resolution.replace(/"/g, '""')}","${log.outcome.replace(/"/g, '""')}"\n`
        })

        csvContent += "\n\n"
      }

      if (reportType === "all" || reportType === "projects") {
        if (reportType === "all") {
          csvContent += "IMPROVEMENT PROJECTS\n"
        } else {
          csvContent += "IMPROVEMENT PROJECTS\n"
          csvContent += `Date Range: ${dateRangeText}\n\n`
        }

        csvContent += "Title,System,Status,Timeline,Contractor Involved,Created At,Objective,Results\n"

        projectsData.forEach((project) => {
          csvContent += `"${project.title}","${project.system}","${project.status}","${
            project.timeline
          }","${project.contractor_involved ? "Yes" : "No"}","${project.created_at}","${project.objective.replace(
            /"/g,
            '""',
          )}","${(project.results || "").replace(/"/g, '""')}"\n`
        })
      }

      // Create a download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `engineering-development-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Report generated",
        description: "Your report has been generated and downloaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)

    try {
      if (reportType === "skills") {
        await generateSkillsPDF()
      } else {
        await generateCSVReport()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-4 flex justify-center">
      <Button onClick={generateReport} disabled={isGenerating} size="lg" className="bg-primary hover:bg-primary/90">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : reportType === "skills" ? (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Skills PDF Report
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Generate and Download CSV Report
          </>
        )}
      </Button>
    </Card>
  )
}
