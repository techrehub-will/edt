"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Home, LightbulbIcon, Target, Zap, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Development Goals",
      icon: Target,
      href: "/dashboard/goals",
      active: pathname === "/dashboard/goals" || pathname?.startsWith("/dashboard/goals/"),
    },
    {
      label: "Technical Logs",
      icon: FileText,
      href: "/dashboard/technical-logs",
      active: pathname === "/dashboard/technical-logs" || pathname?.startsWith("/dashboard/technical-logs/"),
    },
    {
      label: "Improvement Projects",
      icon: LightbulbIcon,
      href: "/dashboard/projects",
      active: pathname === "/dashboard/projects" || pathname?.startsWith("/dashboard/projects/"),
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
    },
    {
      label: "AI Insights",
      icon: Brain,
      href: "/dashboard/ai-insights",
      active: pathname === "/dashboard/ai-insights",
    },
    {
      label: "Integrations",
      icon: Zap,
      href: "/dashboard/integrations",
      active: pathname === "/dashboard/integrations",
    },
    {
      label: "Reports",
      icon: FileText,
      href: "/dashboard/reports",
      active: pathname === "/dashboard/reports",
    },
  ]

  return (
    <div className="hidden border-r bg-card md:block md:w-64">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            EDT
          </div>
          <span className="text-lg font-bold">DevTracker</span>
        </Link>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  route.active ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <route.icon className={cn("h-4 w-4", route.active ? "text-primary" : "text-muted-foreground")} />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
