"use client";

import MeetingCard from "@/components/joyui/meeting/MeetingCard";
import { MeetingRecordListResponse, PortfolioListResponse } from "@/lib/types";
import { Box, Grid, Typography } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MeetingListClientProps {
  initialMeetings: MeetingRecordListResponse[];
  portfolios: PortfolioListResponse[];
}

export default function MeetingListClient({ 
  initialMeetings, 
  portfolios 
}: MeetingListClientProps) {
  const [meetings] = useState(initialMeetings);
  const router = useRouter();

  // Create a portfolio lookup map for efficient name resolution
  const portfolioMap = portfolios.reduce((map, portfolio) => {
    map[portfolio.portfolio_id] = portfolio.name;
    return map;
  }, {} as Record<number, string>);

  const handleMeetingClick = (meetingId: number) => {
    router.push(`/taskbot/meetings/${meetingId}`);
  };

  if (meetings.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography level="h3" color="neutral">
          No meetings found
        </Typography>
        <Typography color="neutral" sx={{ mt: 1 }}>
          There are no meetings to display at this time.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {meetings.map((meeting) => (
        <Grid key={meeting.meeting_id} xs={12} sm={6} md={4}>
          <MeetingCard
            meeting={meeting}
            portfolioName={portfolioMap[meeting.portfolio_id] || "Unknown"}
            onClick={() => handleMeetingClick(meeting.meeting_id)}
          />
        </Grid>
      ))}
    </Grid>
  );
} 