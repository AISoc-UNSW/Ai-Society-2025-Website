import { DashboardLayout } from "@/components/dashboard-layout"
import { MeetingCard } from "@/components/meeting-card"
import { meetings } from "@/lib/data"

export default function MeetingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Meetings</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
