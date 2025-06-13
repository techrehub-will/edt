"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Filter, Clock, FileText, Target, Lightbulb } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useSupabase } from "@/lib/supabase-provider"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "goal" | "log" | "project"
  title: string
  description: string
  category: string
  created_at: string
  relevance: number
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
}

export function SearchBar({
  className,
  placeholder = "Search across all your data...",
  onResultSelect,
}: SearchBarProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    goals: true,
    logs: true,
    projects: true,
  })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recent-searches", JSON.stringify(updated))
  }

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const searchResults: SearchResult[] = []

      // Search goals
      if (filters.goals) {
        const { data: goals } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)

        if (goals) {
          goals.forEach((goal) => {
            const relevance = calculateRelevance(searchQuery, goal.title, goal.description)
            searchResults.push({
              id: goal.id,
              type: "goal",
              title: goal.title,
              description: goal.description,
              category: goal.category,
              created_at: goal.created_at,
              relevance,
            })
          })
        }
      }

      // Search technical logs
      if (filters.logs) {
        const { data: logs } = await supabase
          .from("technical_logs")
          .select("*")
          .eq("user_id", user.id)
          .or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,resolution.ilike.%${searchQuery}%,system.ilike.%${searchQuery}%`,
          )

        if (logs) {
          logs.forEach((log) => {
            const relevance = calculateRelevance(searchQuery, log.title, log.description + " " + log.resolution)
            searchResults.push({
              id: log.id,
              type: "log",
              title: log.title,
              description: log.description,
              category: log.system,
              created_at: log.created_at,
              relevance,
            })
          })
        }
      }

      // Search projects
      if (filters.projects) {
        const { data: projects } = await supabase
          .from("improvement_projects")
          .select("*")
          .eq("user_id", user.id)
          .or(`title.ilike.%${searchQuery}%,objective.ilike.%${searchQuery}%,system.ilike.%${searchQuery}%`)

        if (projects) {
          projects.forEach((project) => {
            const relevance = calculateRelevance(searchQuery, project.title, project.objective)
            searchResults.push({
              id: project.id,
              type: "project",
              title: project.title,
              description: project.objective,
              category: project.system,
              created_at: project.created_at,
              relevance,
            })
          })
        }
      }

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance)
      setResults(searchResults.slice(0, 10)) // Limit to top 10 results
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateRelevance = (query: string, title: string, description: string): number => {
    const queryLower = query.toLowerCase()
    const titleLower = title.toLowerCase()
    const descLower = description.toLowerCase()

    let score = 0

    // Exact title match gets highest score
    if (titleLower.includes(queryLower)) {
      score += 100
    }

    // Description match gets medium score
    if (descLower.includes(queryLower)) {
      score += 50
    }

    // Word matches get additional points
    const queryWords = queryLower.split(" ")
    queryWords.forEach((word) => {
      if (titleLower.includes(word)) score += 20
      if (descLower.includes(word)) score += 10
    })

    return score
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    if (searchQuery.trim()) {
      performSearch(searchQuery)
      saveRecentSearch(searchQuery)
      setIsOpen(true)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery("")

    if (onResultSelect) {
      onResultSelect(result)
    } else {
      // Navigate to the appropriate page
      const basePath =
        result.type === "goal"
          ? "/dashboard/goals"
          : result.type === "log"
            ? "/dashboard/technical-logs"
            : "/dashboard/projects"
      router.push(`${basePath}/${result.id}`)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <Target className="h-4 w-4 text-blue-500" />
      case "log":
        return <FileText className="h-4 w-4 text-emerald-500" />
      case "project":
        return <Lightbulb className="h-4 w-4 text-amber-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "goal":
        return "Goal"
      case "log":
        return "Technical Log"
      case "project":
        return "Project"
      default:
        return type
    }
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (query.trim() || recentSearches.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setQuery("")
                setResults([])
                setIsOpen(false)
                inputRef.current?.focus()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Search in:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="goals"
                      checked={filters.goals}
                      onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, goals: !!checked }))}
                    />
                    <label htmlFor="goals" className="text-sm">
                      Goals
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="logs"
                      checked={filters.logs}
                      onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, logs: !!checked }))}
                    />
                    <label htmlFor="logs" className="text-sm">
                      Technical Logs
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="projects"
                      checked={filters.projects}
                      onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, projects: !!checked }))}
                    />
                    <label htmlFor="projects" className="text-sm">
                      Projects
                    </label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{result.category}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{query}"</div>
            ) : recentSearches.length > 0 ? (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full p-2 text-left text-sm hover:bg-muted/50 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
