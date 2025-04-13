import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Meeting } from "@/lib/types"
import Link from "next/link"

interface MeetingCardProps {
  meeting: Meeting
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{meeting.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {meeting.department}
            </span>
            <span className="text-sm text-muted-foreground">{new Date(meeting.time).toLocaleString()}</span>
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{meeting.summary}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

