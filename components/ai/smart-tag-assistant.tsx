"use client"

import { useState, useEffect } from "react"
import { Tags, Sparkles, Plus, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TagSuggestions {
  suggestedTags: string[]
  categories: {
    technical: string[]
    process: string[]
    equipment: string[]
    skills: string[]
  }
  priority: string[]
  reasoning: string
}

interface SmartTagAssistantProps {
  title: string
  description: string
  system: string
  resolution?: string
  outcome?: string
  currentTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function SmartTagAssistant({
  title,
  description,
  system,
  resolution,
  outcome,
  currentTags,
  onTagsChange,
}: SmartTagAssistantProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ai" | "demo">("demo")

  useEffect(() => {
    if (title && description && system) {
      generateTagSuggestions()
    }
  }, [title, description, system, resolution, outcome])

  const generateTagSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/smart-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          system,
          resolution,
          outcome,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSuggestions(result.tagSuggestions)
        setMode(result.mode)
      }
    } catch (error) {
      console.error("Error generating tag suggestions:", error)
      // Fallback to demo suggestions
      setSuggestions({
        suggestedTags: ["troubleshooting", "maintenance", "system-failure", "documentation"],
        categories: {
          technical: ["troubleshooting", "diagnostics", "repair"],
          process: ["maintenance", "inspection", "testing"],
          equipment: ["system-failure", "component-replacement"],
          skills: ["problem-solving", "documentation"],
        },
        priority: ["troubleshooting", "maintenance"],
        reasoning: "Based on the technical content, these tags will help categorize and find this log entry.",
      })
      setMode("demo")
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    if (!currentTags.includes(tag)) {
      onTagsChange([...currentTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    onTagsChange(currentTags.filter((t) => t !== tag))
  }

  const addAllSuggested = () => {
    if (suggestions) {
      const newTags = suggestions.suggestedTags.filter((tag) => !currentTags.includes(tag))
      onTagsChange([...currentTags, ...newTags])
    }
  }

  if (!suggestions && !loading) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            AI Tag Assistant
            {mode === "demo" && <Badge variant="outline">Demo Mode</Badge>}
          </CardTitle>
          <CardDescription>AI-powered tag suggestions based on your technical content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Analyzing content...</p>
            </div>
          ) : suggestions ? (
            <div className="space-y-4">
              {/* Current Tags */}
              <div>
                <h4 className="font-medium mb-2">Current Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {currentTags.map((tag) => (
                    <Badge key={tag} variant="default" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {currentTags.length === 0 && <p className="text-sm text-muted-foreground">No tags added yet</p>}
                </div>
              </div>

              {/* AI Suggestions */}
              <Tabs defaultValue="suggested" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="suggested">Suggested</TabsTrigger>
                  <TabsTrigger value="categories">By Category</TabsTrigger>
                </TabsList>

                <TabsContent value="suggested" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">AI Suggestions</h4>
                    <Button size="sm" variant="outline" onClick={addAllSuggested} type="button">
                      <Plus className="h-4 w-4 mr-1" />
                      Add All
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestions.suggestedTags.map((tag) => {
                      const isAdded = currentTags.includes(tag)
                      const isPriority = suggestions.priority.includes(tag)
                      return (
                        <Badge
                          key={tag}
                          variant={isAdded ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            isPriority ? "border-yellow-500 bg-yellow-50" : ""
                          }`}
                          onClick={() => (isAdded ? removeTag(tag) : addTag(tag))}
                        >
                          {isPriority && <Sparkles className="h-3 w-3 mr-1" />}
                          {tag}
                          {isAdded && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      )
                    })}
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>AI Reasoning:</strong> {suggestions.reasoning}
                  </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  {Object.entries(suggestions.categories).map(([category, tags]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-2 capitalize">{category} Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const isAdded = currentTags.includes(tag)
                          return (
                            <Badge
                              key={tag}
                              variant={isAdded ? "default" : "outline"}
                              className="cursor-pointer transition-colors"
                              onClick={() => (isAdded ? removeTag(tag) : addTag(tag))}
                            >
                              {tag}
                              {isAdded && <X className="h-3 w-3 ml-1" />}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
