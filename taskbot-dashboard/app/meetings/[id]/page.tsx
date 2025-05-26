"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { RelatedTasksList } from "@/components/related-tasks-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getRelatedTasksForMeeting, meetings } from "@/lib/data"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const meeting = meetings.find((m) => m.id === id)
  const relatedTasks = getRelatedTasksForMeeting(id as string)

  if (!meeting) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center space-y-4">
          <p>Meeting not found</p>
          <Button asChild>
            <Link href="/meetings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Meetings
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/meetings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{meeting.title}</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {meeting.department}
        </div>
        <div className="text-sm text-muted-foreground">{new Date(meeting.time).toLocaleString()}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.transcript.map((line) => (
                <div key={line.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{line.speaker}</span>
                    <span className="text-xs text-muted-foreground">{line.timestamp}</span>
                  </div>
                  <p className="text-sm">{line.text}</p>
                  <Separator className="mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Meeting Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{meeting.summary}</p>
            </CardContent>
          </Card>

          <RelatedTasksList tasks={relatedTasks} />
        </div>
      </div>
    </DashboardLayout>
  )
}
