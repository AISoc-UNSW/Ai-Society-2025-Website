"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SubTask, Task } from "@/lib/types"
import { CheckCircle2, Circle, Clock, Pencil, XCircle } from "lucide-react"

interface TaskDetailsProps {
  task: Task | SubTask | null
  isSubtask: boolean
  onEdit: () => void
}

export function TaskDetails({ task, isSubtask, onEdit }: TaskDetailsProps) {
  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a task to view details</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "In Progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{task.title}</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{isSubtask ? "Subtask" : "Task"}</Badge>
            <Badge variant="outline">{task.department}</Badge>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit Task</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Status</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status)}
              <span>{task.status}</span>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Priority</h4>
            <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Assignees</h4>
          <div className="flex flex-wrap gap-2">
            {task.assignees.map((person) => (
              <div key={person.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{person.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Due Date</h4>
          <p>{new Date(task.dueDate).toLocaleDateString()}</p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
          <p className="text-sm">{task.description}</p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Source</h4>
          <p className="text-sm">{task.source}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
            <p className="text-sm">{new Date(task.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
            <p className="text-sm">{new Date(task.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Task
        </Button>
      </CardFooter>
    </Card>
  )
}

