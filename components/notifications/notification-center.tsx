"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "urgent"
  priority: "low" | "medium" | "high" | "urgent"
  read: boolean
  action_url?: string
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkTableAndFetchNotifications()
  }, [])

  const checkTableAndFetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // First check if the notifications table exists
      const { data: tableCheck, error: tableError } = await supabase.from("notifications").select("id").limit(1)

      if (tableError) {
        // Table doesn't exist, show placeholder notifications
        console.log("Notifications table not found, using placeholder data")
        setTableExists(false)
        setNotifications([
          {
            id: "1",
            title: "Welcome to Engineering Development Tracker!",
            message: "Start by setting your first development goal or logging a technical issue.",
            type: "info",
            priority: "medium",
            read: false,
            action_url: "/dashboard/goals",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Database Setup Required",
            message: "Run the database schema scripts to enable full notification functionality.",
            type: "warning",
            priority: "high",
            read: false,
            created_at: new Date().toISOString(),
          },
        ])
        setLoading(false)
        return
      }

      setTableExists(true)
      await fetchNotifications()
    } catch (error) {
      console.error("Error checking notifications table:", error)
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    if (!tableExists) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setNotifications(data || [])

      // Set up real-time subscription only if table exists
      const channel = supabase
        .channel("notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifications())
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    if (!tableExists) {
      // For placeholder notifications, just update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      return
    }

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!tableExists) {
      // For placeholder notifications, just update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      return
    }

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Notifications
              {!tableExists && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Demo Mode
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 border-b hover:bg-muted/50 cursor-pointer group",
                        !notification.read && "bg-muted/30",
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{notification.title}</p>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                getPriorityColor(notification.priority),
                              )}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
