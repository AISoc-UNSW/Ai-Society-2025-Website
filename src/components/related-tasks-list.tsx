import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task } from "@/lib/types"
import Link from "next/link"

interface RelatedTasksListProps {
  tasks: Task[]
}

export function RelatedTasksList({ tasks }: RelatedTasksListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No related tasks found for this meeting.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-md border p-3 transition-colors hover:bg-muted/50">
              <Link href={`/tasks?taskId=${task.id}`} className="block">
                <span className="font-medium">{task.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
