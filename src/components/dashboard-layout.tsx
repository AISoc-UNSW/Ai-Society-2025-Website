"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CalendarDays, ListChecks, LogOut, Settings, SquareStack } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  username?: string
  role?: string
}

export function DashboardLayout({ children, username, role }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Generate user initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  const displayName = username || "John Doe"
  const displayRole = role || "Administrator"
  const initials = getInitials(displayName)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="flex flex-col items-center justify-center py-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tasks"}>
                  <Link href="/tasks">
                    <SquareStack className="h-5 w-5" />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tasks-quick-view"}>
                  <Link href="/tasks-quick-view">
                    <ListChecks className="h-5 w-5" />
                    <span>My Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/meetings"}>
                  <Link href="/meetings">
                    <CalendarDays className="h-5 w-5" />
                    <span>Meetings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-4">
            <SidebarMenuButton asChild>
              <Link href="/login">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </div>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b bg-background p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
