import MeetingDetailClient from "@/components/joyui/meeting/MeetingDetailClient";
import { getMeetingRecordById, getTasksByMeeting } from "@/lib/api/meetingRecord";
import { getAllPortfolios } from "@/lib/api/permissions";
import { Box, CircularProgress, Typography } from "@mui/joy";
import { Suspense } from "react";

interface MeetingDetailPageProps {
  params: {
    meeting_id: string;
  };
}

async function MeetingDetailData({ meetingId }: { meetingId: number }) {
  try {
    const [meetingDetails, relatedTasks, portfolios] = await Promise.all([
      getMeetingRecordById(meetingId),
      getTasksByMeeting(meetingId),
      getAllPortfolios()
    ]);

    return (
      <MeetingDetailClient
        meeting={meetingDetails}
        relatedTasks={relatedTasks}
        portfolios={portfolios}
      />
    );
  } catch (error) {
    console.error("Error fetching meeting detail data:", error);
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="danger">
          Failed to load meeting details. Please try again.
        </Typography>
      </Box>
    );
  }
}

function MeetingDetailLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { meeting_id } = await params;
  const meetingId = parseInt(meeting_id);

  if (isNaN(meetingId)) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="danger">
          Invalid meeting ID
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Suspense fallback={<MeetingDetailLoading />}>
        <MeetingDetailData meetingId={meetingId} />
      </Suspense>
    </Box>
  );
} 