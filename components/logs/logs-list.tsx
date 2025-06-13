"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FilePreview } from "@/components/ui/file-preview"

interface LogsListProps {
  logs: any[]
}

export function LogsList({ logs: initialLogs }: LogsListProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterSystem, setFilterSystem] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Get unique systems
  const systems = Array.from(new Set(logs.map((log) => log.system)))

  // Filter and sort logs
  const filteredLogs = logs
    .filter((log) => {
      const matchesSystem = filterSystem === "all" || log.system === filterSystem
      const matchesSearch =
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSystem && matchesSearch
    })
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systems.map((system) => (
                <SelectItem key={system} value={system}>
                  {system}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("created_at")}>
                Date Created {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("title")}>
                Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("system")}>
                System {sortBy === "system" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {searchQuery || filterSystem !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating a new technical log"}
          </p>
          <Link href="/dashboard/technical-logs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Log
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="card-hover overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{log.title}</CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">{log.system}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/technical-logs/${log.id}/edit`}>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{log.description}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 p-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {log.tags &&
                      log.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    {log.tags && log.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{log.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.images && log.images.length > 0 && (
                      <div className="flex items-center gap-1">
                        {log.images.slice(0, 2).map((imageUrl: string, index: number) => (
                          <FilePreview
                            key={index}
                            fileName={`Attachment ${index + 1}`}
                            fileUrl={imageUrl}
                            fileType="image/jpeg"
                            className="h-6 w-6 p-0"
                          />
                        ))}
                        {log.images.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{log.images.length - 2} more</span>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
