import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function LogsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Technical Logs</h2>
        <p className="text-muted-foreground">Document resolved issues and technical solutions</p>
      </div>
      <Link href="/dashboard/technical-logs/new">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Log
        </Button>
      </Link>
    </div>
  )
}
