import MeetingListClient from "@/components/joyui/meeting/MeetingListClient";
import { getMeetingRecords } from "@/lib/api/meetingRecord";
import { getAllPortfolios } from "@/lib/api/permissions";
import { Box, CircularProgress, Typography } from "@mui/joy";
import { Suspense } from "react";

async function MeetingData() {
  try {
    const [meetingRecords, portfolios] = await Promise.all([
      getMeetingRecords(),
      getAllPortfolios()
    ]);

    return (
      <MeetingListClient 
        initialMeetings={meetingRecords} 
        portfolios={portfolios}
      />
    );
  } catch (error) {
    console.error("Error fetching meeting data:", error);
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="danger">
          Failed to load meetings. Please try again later.
        </Typography>
      </Box>
    );
  }
}

function MeetingLoadingState() {
  return (
    <Box sx={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "50vh" 
    }}>
      <CircularProgress />
    </Box>
  );
}

export default function MeetingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography level="h1" sx={{ mb: 3 }}>
        Meetings
      </Typography>
      <Suspense fallback={<MeetingLoadingState />}>
        <MeetingData />
      </Suspense>
    </Box>
  );
} 