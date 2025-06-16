"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileText, Home, LightbulbIcon, Target, Zap, Brain, Menu, X, User, Settings, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      label: "Projects",
      icon: LightbulbIcon,
      href: "/dashboard/projects",
      active: pathname === "/dashboard/projects" || pathname?.startsWith("/dashboard/projects/"),
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: pathname === "/dashboard/analytics",
    },    {
      label: "AI Insights",
      icon: Brain,
      href: "/dashboard/ai-insights",
      active: pathname === "/dashboard/ai-insights",
    },
    {
      label: "AI Copilot",
      icon: MessageCircle,
      href: "/dashboard/ai-copilot",
      active: pathname === "/dashboard/ai-copilot",
    },
    // {
    //   label: "Integrations",
    //   icon: Zap,
    //   href: "/dashboard/integrations",
    //   active: pathname === "/dashboard/integrations",
    // },   
     {
      label: "Reports",
      icon: FileText,
      href: "/dashboard/reports",
      active: pathname === "/dashboard/reports",
    },    {
      label: "Profile",
      icon: User,
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="flex items-center justify-center w-10 h-10 rounded-md bg-card border shadow-sm"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-card md:block md:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              EDT
            </div>
            <span className="text-lg font-bold">Development Tracker</span>
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

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 border-r bg-card transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6 pt-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={closeMobileMenu}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              EDT
            </div>
            <span className="text-lg font-bold">Development Tracker</span>
          </Link>
        </div>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={closeMobileMenu}
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
    </>
  )
}
