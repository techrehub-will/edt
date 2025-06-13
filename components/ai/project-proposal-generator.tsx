"use client"

import { useState } from "react"
import { FileText, Download, Sparkles, Clock, Users, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectProposal {
  proposal: {
    executiveSummary: string
    problemStatement: string
    proposedSolution: string
    scope: {
      included: string[]
      excluded: string[]
    }
    timeline: {
      phases: Array<{
        name: string
        duration: string
        deliverables: string[]
      }>
      totalDuration: string
    }
    resources: {
      personnel: string[]
      equipment: string[]
      materials: string[]
    }
    riskAssessment: Array<{
      risk: string
      probability: string
      impact: string
      mitigation: string
    }>
    successCriteria: string[]
    budget: {
      estimated: string
      breakdown: string[]
    }
  }
  recommendations: string[]
  nextSteps: string[]
}

interface ProjectProposalGeneratorProps {
  title: string
  objective: string
  system: string
  onProposalGenerated?: (proposal: ProjectProposal) => void
}

export function ProjectProposalGenerator({
  title,
  objective,
  system,
  onProposalGenerated,
}: ProjectProposalGeneratorProps) {
  const [proposal, setProposal] = useState<ProjectProposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ai" | "demo">("demo")

  const generateProposal = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/project-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          objective,
          system,
          userContext: {},
        }),
      })

      const result = await response.json()
      if (result.success) {
        setProposal(result.proposal)
        setMode(result.mode)
        onProposalGenerated?.(result.proposal)
      }
    } catch (error) {
      console.error("Error generating proposal:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportProposal = () => {
    if (!proposal) return

    const content = `
# ${title}

## Executive Summary
${proposal.proposal.executiveSummary}

## Problem Statement
${proposal.proposal.problemStatement}

## Proposed Solution
${proposal.proposal.proposedSolution}

## Project Scope

### Included:
${proposal.proposal.scope.included.map((item) => `- ${item}`).join("\n")}

### Excluded:
${proposal.proposal.scope.excluded.map((item) => `- ${item}`).join("\n")}

## Timeline (${proposal.proposal.timeline.totalDuration})

${proposal.proposal.timeline.phases
  .map(
    (phase) => `
### ${phase.name} (${phase.duration})
Deliverables:
${phase.deliverables.map((d) => `- ${d}`).join("\n")}
`,
  )
  .join("\n")}

## Resources Required

### Personnel:
${proposal.proposal.resources.personnel.map((p) => `- ${p}`).join("\n")}

### Equipment:
${proposal.proposal.resources.equipment.map((e) => `- ${e}`).join("\n")}

### Materials:
${proposal.proposal.resources.materials.map((m) => `- ${m}`).join("\n")}

## Risk Assessment

${proposal.proposal.riskAssessment
  .map(
    (risk) => `
**${risk.risk}**
- Probability: ${risk.probability}
- Impact: ${risk.impact}
- Mitigation: ${risk.mitigation}
`,
  )
  .join("\n")}

## Success Criteria
${proposal.proposal.successCriteria.map((c) => `- ${c}`).join("\n")}

## Budget
${proposal.proposal.budget.estimated}

### Breakdown:
${proposal.proposal.budget.breakdown.map((b) => `- ${b}`).join("\n")}

## Recommendations
${proposal.recommendations.map((r) => `- ${r}`).join("\n")}

## Next Steps
${proposal.nextSteps.map((s) => `- ${s}`).join("\n")}
    `

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "_")}_proposal.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Project Proposal Generator
          {mode === "demo" && <Badge variant="outline">Demo Mode</Badge>}
        </CardTitle>
        <CardDescription>Generate comprehensive project proposals with AI assistance</CardDescription>
      </CardHeader>
      <CardContent>
        {!proposal ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate a detailed project proposal based on your project information
            </p>
            <Button onClick={generateProposal} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Proposal...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Proposal
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Proposal</h3>
              <Button onClick={exportProposal} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{proposal.proposal.executiveSummary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Problem Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{proposal.proposal.problemStatement}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Proposed Solution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{proposal.proposal.proposedSolution}</p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scope - Included</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {proposal.proposal.scope.included.map((item, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scope - Excluded</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {proposal.proposal.scope.excluded.map((item, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-red-500">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Total Duration:</strong> {proposal.proposal.timeline.totalDuration}
                  </AlertDescription>
                </Alert>

                {proposal.proposal.timeline.phases.map((phase, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="outline">{phase.duration}</Badge>
                        {phase.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-2">Deliverables:</h4>
                      <ul className="space-y-1">
                        {phase.deliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Personnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {proposal.proposal.resources.personnel.map((person, index) => (
                          <li key={index} className="text-sm">
                            {person}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Equipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {proposal.proposal.resources.equipment.map((equipment, index) => (
                          <li key={index} className="text-sm">
                            {equipment}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {proposal.proposal.resources.materials.map((material, index) => (
                          <li key={index} className="text-sm">
                            {material}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold mb-2">{proposal.proposal.budget.estimated}</p>
                    <h4 className="font-medium mb-2">Breakdown:</h4>
                    <ul className="space-y-1">
                      {proposal.proposal.budget.breakdown.map((item, index) => (
                        <li key={index} className="text-sm">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                {proposal.proposal.riskAssessment.map((risk, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{risk.risk}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-3 mb-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Probability:</span>
                          <Badge variant={risk.probability === "High" ? "destructive" : "outline"} className="ml-2">
                            {risk.probability}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Impact:</span>
                          <Badge variant={risk.impact === "High" ? "destructive" : "outline"} className="ml-2">
                            {risk.impact}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Mitigation:</span>
                        <p className="text-sm mt-1">{risk.mitigation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Success Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {proposal.proposal.successCriteria.map((criteria, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {proposal.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500">💡</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {proposal.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-primary">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
