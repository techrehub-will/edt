import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function GoalsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Development Goals</h2>
        <p className="text-muted-foreground">Set and track your professional development goals</p>
      </div>
      <Link href="/dashboard/goals/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </Link>
    </div>
  )
}
