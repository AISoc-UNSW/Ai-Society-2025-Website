"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { useState } from "react"

interface StatusToggleProps {
  initialStatus: "Not Started" | "In Progress" | "Completed"
  onStatusChange: (status: "Not Started" | "In Progress" | "Completed") => void
}

export function StatusToggle({ initialStatus, onStatusChange }: StatusToggleProps) {
  const [status, setStatus] = useState<"Not Started" | "In Progress" | "Completed">(initialStatus)

  const handleStatusChange = (newStatus: "Not Started" | "In Progress" | "Completed") => {
    setStatus(newStatus)
    onStatusChange(newStatus)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={status === "Not Started" ? "default" : "ghost"}
        size="sm"
        className={`h-8 px-2 ${status === "Not Started" ? "" : "text-muted-foreground"}`}
        onClick={() => handleStatusChange("Not Started")}
      >
        <Circle className="mr-1 h-4 w-4 text-gray-500" />
        Not Started
      </Button>
      <Button
        variant={status === "In Progress" ? "default" : "ghost"}
        size="sm"
        className={`h-8 px-2 ${status === "In Progress" ? "" : "text-muted-foreground"}`}
        onClick={() => handleStatusChange("In Progress")}
      >
        <Clock className={`mr-1 h-4 w-4 ${status === "In Progress" ? "text-amber-500" : "text-amber-500"}`} />
        In Progress
      </Button>
      <Button
        variant={status === "Completed" ? "default" : "ghost"}
        size="sm"
        className={`h-8 px-2 ${status === "Completed" ? "" : "text-muted-foreground"}`}
        onClick={() => handleStatusChange("Completed")}
      >
        <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
        Completed
      </Button>
    </div>
  )
}
