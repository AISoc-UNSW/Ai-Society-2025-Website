"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatusToggle } from "@/components/status-toggle"
import { SubtaskDetailsModal } from "@/components/subtask-details-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type SortDirection, type SortOption, TaskFilters } from "@/components/task-filters"
import { departments, tasks } from "@/lib/data"
import type { Department, PriorityLevel, SubTask, TaskStatus } from "@/lib/types"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"

const allStatuses: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"]
const allPriorities: PriorityLevel[] = ["Low", "Medium", "High", "Critical"]

// Mock current user - Jane Smith
const currentUser = { id: "person-1", name: "Jane Smith" }

export default function TasksQuickViewPage() {
  // Filter state
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Modal state
  const [selectedSubtask, setSelectedSubtask] = useState<(SubTask & { parentTask?: string }) | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Filtered and sorted subtasks
  const [filteredSubtasks, setFilteredSubtasks] = useState<(SubTask & { parentTask?: string })[]>([])

  // Get all subtasks assigned to current user
  const getAllAssignedSubtasks = (): (SubTask & { parentTask?: string })[] => {
    const assignedSubtasks: (SubTask & { parentTask?: string })[] = []

    tasks.forEach((task) => {
      task.subtasks.forEach((subtask) => {
        if (subtask.assignees.some((assignee) => assignee.id === currentUser.id)) {
          assignedSubtasks.push({
            ...subtask,
            parentTask: task.title, // Add parent task info
          })
        }
      })
    })

    return assignedSubtasks
  }

  // Apply filters and sorting
  useEffect(() => {
    let result = getAllAssignedSubtasks()

    // Apply department filter
    if (selectedDepartments.length > 0) {
      result = result.filter((subtask) => selectedDepartments.includes(subtask.department))
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((subtask) => selectedStatuses.includes(subtask.status))
    }

    // Apply priority filter
    if (selectedPriorities.length > 0) {
      result = result.filter((subtask) => selectedPriorities.includes(subtask.priority))
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (subtask) => subtask.title.toLowerCase().includes(query) || subtask.description.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "priority":
          const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case "status":
          const statusOrder = { "Not Started": 0, "In Progress": 1, Completed: 2, Cancelled: 3 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredSubtasks(result)
  }, [selectedDepartments, selectedStatuses, selectedPriorities, searchQuery, sortBy, sortDirection])

  // Handle sort change
  const handleSortChange = (option: SortOption, direction: SortDirection) => {
    setSortBy(option)
    setSortDirection(direction)
  }

  // Handle status change
  const handleStatusChange = (subtaskId: string, newStatus: "Not Started" | "In Progress" | "Completed") => {
    // In a real app, this would make an API call to update the status
    console.log(`Updating subtask ${subtaskId} status to ${newStatus}`)

    // Update the local state to reflect the change
    setFilteredSubtasks(
      filteredSubtasks.map((subtask) => {
        if (subtask.id === subtaskId) {
          return { ...subtask, status: newStatus }
        }
        return subtask
      }),
    )
  }

  // Open details modal
  const openDetailsModal = (subtask: SubTask & { parentTask?: string }) => {
    setSelectedSubtask(subtask)
    setDetailsModalOpen(true)
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive"
      case "High":
        return "default"
      case "Medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
      </div>

      <TaskFilters
        departments={departments}
        statuses={allStatuses}
        priorities={allPriorities}
        selectedDepartments={selectedDepartments}
        selectedStatuses={selectedStatuses}
        selectedPriorities={selectedPriorities}
        sortBy={sortBy}
        sortDirection={sortDirection}
        searchQuery={searchQuery}
        onDepartmentChange={setSelectedDepartments}
        onStatusChange={setSelectedStatuses}
        onPriorityChange={setSelectedPriorities}
        onSortChange={handleSortChange}
        onSearchChange={setSearchQuery}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assigned Tasks</h2>
        {filteredSubtasks.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">No tasks assigned to you match your filters</p>
          </div>
        ) : (
          filteredSubtasks.map((subtask) => (
            <Card key={subtask.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{subtask.title}</h3>
                  <Badge variant={getPriorityBadgeVariant(subtask.priority)}>{subtask.priority}</Badge>
                </div>

                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <StatusToggle
                    initialStatus={subtask.status as "Not Started" | "In Progress" | "Completed"}
                    onStatusChange={(status) => handleStatusChange(subtask.id, status)}
                  />

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Due: {new Date(subtask.dueDate).toLocaleDateString()}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {subtask.department}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{subtask.description}</p>

                {subtask.parentTask && (
                  <div className="mt-3 text-xs text-muted-foreground">From: {subtask.parentTask}</div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => openDetailsModal(subtask)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedSubtask && (
        <SubtaskDetailsModal subtask={selectedSubtask} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
      )}
    </DashboardLayout>
  )
}
