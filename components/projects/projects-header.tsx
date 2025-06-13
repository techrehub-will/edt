import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ProjectsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Improvement Projects</h2>
        <p className="text-muted-foreground">Track Kaizen-style initiatives and contractor-managed jobs</p>
      </div>
      <Link href="/dashboard/projects/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </Link>
    </div>
  )
}
