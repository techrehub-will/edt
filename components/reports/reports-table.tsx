"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/lib/supabase-provider"
import { format } from "date-fns"

interface ReportItem {
  id: string
  type: "Goal" | "Log" | "Project" | "Skills Analysis"
  title: string
  status: string
  date: string
  category: string
  details?: string
}

interface ReportsTableProps {
  reportType?: string
  dateRange?: string
  startDate?: string
  endDate?: string
}

export function ReportsTable({ reportType = "all", dateRange = "all", startDate, endDate }: ReportsTableProps) {
  const { supabase } = useSupabase()
  const [data, setData] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const columns: ColumnDef<ReportItem>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        const getTypeColor = (type: string) => {
          switch (type) {
            case "Goal":
              return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "Log":
              return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            case "Project":
              return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            case "Skills Analysis":
              return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
            default:
              return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
          }
        }
        return (
          <Badge variant="outline" className={getTypeColor(type)}>
            {type}
          </Badge>
        )
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <div>{row.getValue("status")}</div>,
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.getValue("details") as string
        return details ? <div className="text-sm text-muted-foreground truncate max-w-xs">{details}</div> : null
      },
    },
  ]

  useEffect(() => {
    async function fetchData() {
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
        let skillsData: any[] = []

        if (reportType === "all" || reportType === "goals") {
          const goalsQuery = supabase.from("goals").select("*").eq("user_id", user.id)

          if (fromDate) {
            goalsQuery.gte("created_at", fromDate.toISOString())
          }

          if (toDate) {
            goalsQuery.lte("created_at", toDate.toISOString())
          }

          const { data: goals, error: goalsError } = await goalsQuery

          if (!goalsError && goals) {
            goalsData = goals.map((goal) => ({
              id: goal.id,
              type: "Goal" as const,
              title: goal.title,
              status: goal.status,
              date: format(new Date(goal.created_at), "yyyy-MM-dd"),
              category: goal.category,
              details: goal.description.substring(0, 100) + "...",
            }))
          }
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

          if (!logsError && logs) {
            logsData = logs.map((log) => ({
              id: log.id,
              type: "Log" as const,
              title: log.title,
              status: "Completed",
              date: format(new Date(log.created_at), "yyyy-MM-dd"),
              category: log.system,
              details: log.description.substring(0, 100) + "...",
            }))
          }
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

          if (!projectsError && projects) {
            projectsData = projects.map((project) => ({
              id: project.id,
              type: "Project" as const,
              title: project.title,
              status: project.status,
              date: format(new Date(project.created_at), "yyyy-MM-dd"),
              category: project.system,
              details: project.objective.substring(0, 100) + "...",
            }))
          }
        }

        if (reportType === "all" || reportType === "skills") {
          const skillsQuery = supabase.from("skills_analysis").select("*").eq("user_id", user.id)

          if (fromDate) {
            skillsQuery.gte("analysis_date", fromDate.toISOString())
          }

          if (toDate) {
            skillsQuery.lte("analysis_date", toDate.toISOString())
          }

          const { data: skills, error: skillsError } = await skillsQuery

          if (!skillsError && skills) {
            skillsData = skills.map((analysis) => {
              const skillsArray = analysis.skills as any[]
              const suggestionsArray = analysis.suggestions as any[]
              return {
                id: analysis.id,
                type: "Skills Analysis" as const,
                title: `Skills Analysis - ${skillsArray.length} skills identified`,
                status: "Completed",
                date: format(new Date(analysis.analysis_date), "yyyy-MM-dd"),
                category: analysis.report_type,
                details: `${skillsArray.length} skills, ${suggestionsArray.length} suggestions`,
              }
            })
          }
        }

        // Combine all data
        const combinedData = [...goalsData, ...logsData, ...projectsData, ...skillsData]
        setData(combinedData)
      } catch (error) {
        console.error("Error fetching report data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, reportType, dateRange, startDate, endDate])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
