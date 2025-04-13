"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TaskFilters } from "@/components/task-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tasks } from "@/lib/data"
import { useState, useEffect } from "react"

const priorityStyles: Record<string, string> = {
  Critical: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 mt-1",
  High: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-500 text-white hover:bg-blue-500/80 mt-1",
  Medium: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-500 text-white hover:bg-gray-500/80 mt-1",
  Low: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white hover:bg-green-500/80 mt-1",
}

export default function TaskQuickViewPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [finishedTasks, setFinishedTasks] = useState<Set<string>>(new Set())
  const [filteredSubtasks, setFilteredSubtasks] = useState<any[]>([])

  useEffect(() => {
    let subtasks = tasks.flatMap((task) => task.subtasks)

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      subtasks = subtasks.filter((subtask) =>
        subtask.title.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    subtasks.sort((a, b) => {
      let comparison = 0
      if (sortBy === "dueDate") {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (sortBy === "priority") {
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
      } else if (sortBy === "status") {
        const statusOrder = { "Not Started": 0, "In Progress": 1, Completed: 2, Cancelled: 3 }
        comparison = statusOrder[a.status] - statusOrder[b.status]
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredSubtasks(subtasks)
  }, [searchQuery, sortBy, sortDirection])

  const handleCheckboxChange = (subtaskId: string) => {
    setFinishedTasks((prev) => {
      const updated = new Set(prev)
      if (updated.has(subtaskId)) {
        updated.delete(subtaskId)
      } else {
        updated.add(subtaskId)
      }
      return updated
    })
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks Quick-View</h1>
        <p className="text-sm text-muted-foreground">This will be sorted based on an individual's page</p>
      </div>

      {/* Filters */}
      <TaskFilters
        statuses={["Not Started", "In Progress", "Completed", "Cancelled"]}
        priorities={["Low", "Medium", "High", "Critical"]}
        selectedStatuses={[]} // No statuses for subtasks
        selectedPriorities={[]}
        departments={[]} // No departments for subtasks
        selectedDepartments={[]} // No selected departments for subtasks
        sortBy={sortBy}
        sortDirection={sortDirection}
        searchQuery={searchQuery}
        onStatusChange={() => {}} // No-op for statuses
        onPriorityChange={() => {}} // No-op for priorities
        onDepartmentChange={() => {}} // No-op for departments
        onSortChange={(option, direction) => {
          setSortBy(option as "dueDate" | "priority" | "status")
          setSortDirection(direction)
        }}
        onSearchChange={setSearchQuery}
      />

      {/* Quick view to show the subtask details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubtasks.length === 0 ? (
          <div className="col-span-full flex h-40 items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">No subtasks available</p>
          </div>
        ) : (
          filteredSubtasks.map((subtask) => (
            <Card key={subtask.id}>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={finishedTasks.has(subtask.id)}
                      onChange={() => handleCheckboxChange(subtask.id)}
                      className="h-4 w-4"
                    />
                    {subtask.title}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  Priority: <span className={priorityStyles[subtask.priority]}>{subtask.priority}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">Due Date: {subtask.dueDate}</p>
                <p className="text-sm text-muted-foreground mt-2">Description: {subtask.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
