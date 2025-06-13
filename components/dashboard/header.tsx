import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">Here's an overview of your development progress</p>
      </div>
      <div className="flex items-center gap-4">
        <SearchBar className="w-80" />
        <Button>Export Data</Button>
      </div>
    </div>
  )
}
