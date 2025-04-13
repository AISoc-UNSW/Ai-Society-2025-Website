"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SubTask, Task } from "@/lib/types"
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, XCircle } from "lucide-react"
import { useState } from "react"

interface TaskCardProps {
  task: Task
  onSelectTask: (taskId: string, isSubtask: boolean) => void
  onSelectSubtask: (subtaskId: string, isSubtask: boolean) => void
  selectedTaskId?: string
  selectedSubtaskId?: string
}

export function TaskCard({ task, onSelectTask, onSelectSubtask, selectedTaskId, selectedSubtaskId }: TaskCardProps) {
  const [expanded, setExpanded] = useState(true)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
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
    <Card className={`mb-4 transition-colors hover:bg-muted/50 ${selectedTaskId === task.id ? "border-primary" : ""}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={() => onSelectTask(task.id, false)}>
            <CardTitle className="text-lg">{task.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Assignees</p>
            <div className="mt-1 flex -space-x-2">
              {task.assignees.map((person) => (
                <Avatar key={person.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1 flex items-center gap-1">
              {getStatusIcon(task.status)}
              <span className="text-sm">{task.status}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Priority</p>
            <Badge variant={getPriorityBadgeVariant(task.priority)} className="mt-1">
              {task.priority}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="mt-1 text-sm">{new Date(task.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        {expanded && task.subtasks.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
              {task.subtasks.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  onSelect={onSelectSubtask}
                  isSelected={selectedSubtaskId === subtask.id}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface SubtaskRowProps {
  subtask: SubTask
  onSelect: (subtaskId: string, isSubtask: boolean) => void
  isSelected: boolean
}

function SubtaskRow({ subtask, onSelect, isSelected }: SubtaskRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
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
    <div
      className={`cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${
        isSelected ? "border-primary" : ""
      }`}
      onClick={() => onSelect(subtask.id, true)}
    >
      <div className="mb-2 flex items-center gap-2">
        {getStatusIcon(subtask.status)}
        <span className="font-medium">{subtask.title}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Assignees</p>
          <div className="mt-1 flex -space-x-2">
            {subtask.assignees.map((person) => (
              <Avatar key={person.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={person.avatar} alt={person.name} />
                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Priority</p>
          <Badge variant={getPriorityBadgeVariant(subtask.priority)} className="mt-1">
            {subtask.priority}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Due Date</p>
          <p className="mt-1 text-sm">{new Date(subtask.dueDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

