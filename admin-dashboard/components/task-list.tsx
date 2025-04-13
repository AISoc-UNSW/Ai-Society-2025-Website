"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Task } from "@/lib/types"
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  onSelectTask: (taskId: string) => void
  selectedTaskId?: string
}

export function TaskList({ tasks, onSelectTask, selectedTaskId }: TaskListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tasks</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedTaskId === task.id ? "border-primary" : ""
            }`}
            onClick={() => onSelectTask(task.id)}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">Assigned to: {task.assignedTo}</p>
              <div className="mt-3 space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {subtask.status === "Completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : subtask.status === "In Progress" ? (
                        <Clock className="h-4 w-4 text-blue-500" />
                      ) : subtask.status === "Cancelled" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{subtask.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          subtask.priority === "Critical"
                            ? "destructive"
                            : subtask.priority === "High"
                              ? "default"
                              : subtask.priority === "Medium"
                                ? "secondary"
                                : "outline"
                        }
                        className="text-xs"
                      >
                        {subtask.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(subtask.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

