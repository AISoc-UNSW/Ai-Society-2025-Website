"use client"

import { CreateTaskDialog } from "@/components/create-task-dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/task-card"
import { TaskDetails } from "@/components/task-details"
import { type SortDirection, type SortOption, TaskFilters } from "@/components/task-filters"
import { departments, people, tasks } from "@/lib/data"
import type { Department, PriorityLevel, SubTask, Task, TaskStatus } from "@/lib/types"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"


const allStatuses: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"]
const allPriorities: PriorityLevel[] = ["Low", "Medium", "High", "Critical"]

export default function TasksPage() {
  // Oauth user state
  const [oauthUser, setOauthUser] = useState<{
    userId: string
    username: string
    discordId: string
  } | null>(null)

  // Get search params and router
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // 1. Get OAuth login status from URL
    const login = searchParams.get("login")             // "success"
    const userId = searchParams.get("user_id")          // database user_id
    const username = searchParams.get("username")       // database username
    const discordId = searchParams.get("discord_id")    // Discord user ID

    // 2. If login === "success" and other required fields exist, it is an existing user just logged in via Discord
    if (login === "success" && userId && username && discordId) {
      setOauthUser({ userId, username, discordId })
      // 3. Remove OAuth login status from URL
      router.replace("/tasks")
    }
  }, [searchParams, router])


  // Selected task state
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined)
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | undefined>(undefined)
  const [isViewingSubtask, setIsViewingSubtask] = useState(false)

  // Filter state
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Filtered and sorted tasks
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tasks]

    // Apply department filter
    if (selectedDepartments.length > 0) {
      result = result.filter((task) => selectedDepartments.includes(task.department))
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((task) => selectedStatuses.includes(task.status))
    }

    // Apply priority filter
    if (selectedPriorities.length > 0) {
      result = result.filter((task) => selectedPriorities.includes(task.priority))
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.subtasks.some(
            (subtask) =>
              subtask.title.toLowerCase().includes(query) || subtask.description.toLowerCase().includes(query),
          ),
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

    setFilteredTasks(result)
  }, [selectedDepartments, selectedStatuses, selectedPriorities, searchQuery, sortBy, sortDirection])

  // Handle task selection
  const handleSelectTask = (taskId: string, isSubtask: boolean) => {
    if (isSubtask) {
      setSelectedSubtaskId(taskId)
      setSelectedTaskId(undefined)
      setIsViewingSubtask(true)
    } else {
      setSelectedTaskId(taskId)
      setSelectedSubtaskId(undefined)
      setIsViewingSubtask(false)
    }
  }

  // Get selected task or subtask
  const getSelectedItem = (): Task | SubTask | null => {
    if (isViewingSubtask && selectedSubtaskId) {
      for (const task of tasks) {
        const subtask = task.subtasks.find((st) => st.id === selectedSubtaskId)
        if (subtask) return subtask
      }
      return null
    } else if (selectedTaskId) {
      return tasks.find((task) => task.id === selectedTaskId) || null
    }
    return null
  }

  // Handle sort change
  const handleSortChange = (option: SortOption, direction: SortDirection) => {
    setSortBy(option)
    setSortDirection(direction)
  }

  // Handle create task
  const handleCreateTask = (taskData: any) => {
    // In a real app, this would make an API call to create the task
    console.log("Creating task:", taskData)
    // Then refresh the task list
  }

  // Handle edit task
  const handleEditTask = () => {
    setEditDialogOpen(true)
  }

  return (
    <DashboardLayout>
      {oauthUser && (
        <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">
          Welcome back, <strong>{oauthUser.username}</strong>! Discord ID: {oauthUser.discordId}
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Task List</h2>
          {filteredTasks.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-muted-foreground">No tasks match your filters</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelectTask={handleSelectTask}
                onSelectSubtask={handleSelectTask}
                selectedTaskId={selectedTaskId}
                selectedSubtaskId={selectedSubtaskId}
              />
            ))
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Task Details</h2>
          <TaskDetails task={getSelectedItem()} isSubtask={isViewingSubtask} onEdit={handleEditTask} />
        </div>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        departments={departments}
        statuses={allStatuses}
        priorities={allPriorities}
        people={people}
        onCreateTask={handleCreateTask}
      />
    </DashboardLayout>
  )
}
