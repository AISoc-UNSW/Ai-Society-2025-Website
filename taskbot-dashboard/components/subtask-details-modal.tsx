"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { SubTask } from "@/lib/types"
import { CheckCircle2, Circle, Clock, X, XCircle } from "lucide-react"

interface SubtaskDetailsModalProps {
  subtask: SubTask & { parentTask?: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubtaskDetailsModal({ subtask, open, onOpenChange }: SubtaskDetailsModalProps) {
  if (!subtask) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "In Progress":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-500" />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{subtask.title}</DialogTitle>
          <DialogDescription>
            {subtask.parentTask && <span className="text-muted-foreground">From: {subtask.parentTask}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Status</h4>
              <div className="flex items-center gap-2">
                {getStatusIcon(subtask.status)}
                <span>{subtask.status}</span>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Priority</h4>
              <Badge variant={getPriorityBadgeVariant(subtask.priority)}>{subtask.priority}</Badge>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Assignees</h4>
            <div className="flex flex-wrap gap-2">
              {subtask.assignees.map((person) => (
                <div key={person.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={person.avatar || "/placeholder.svg"} alt={person.name} />
                    <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{person.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Due Date</h4>
            <p>{new Date(subtask.dueDate).toLocaleDateString()}</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
            <p className="text-sm">{subtask.description}</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Department</h4>
            <Badge variant="outline">{subtask.department}</Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">{new Date(subtask.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
              <p className="text-sm">{new Date(subtask.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
