"use client";

import { MeetingRecordListResponse } from "@/lib/types";
import { Box, Card, CardContent, Chip, Typography } from "@mui/joy";

interface MeetingCardProps {
  meeting: MeetingRecordListResponse;
  portfolioName: string;
  onClick: () => void;
}

export default function MeetingCard({ 
  meeting, 
  portfolioName, 
  onClick 
}: MeetingCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getPortfolioColor = (portfolio: string) => {
    return 'primary' as const;
  };

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        height: '240px', // Fixed height
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 'md',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header with portfolio and date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Chip
            color={getPortfolioColor(portfolioName)}
            size="sm"
            variant="soft"
            sx={{ flexShrink: 0 }}
          >
            {portfolioName}
          </Chip>
          <Typography level="body-sm" color="neutral" sx={{ flexShrink: 0 }}>
            {formatDate(meeting.meeting_date)}
          </Typography>
        </Box>

        {/* Meeting title */}
        <Typography 
          level="title-md" 
          sx={{ 
            fontWeight: 'bold',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
            minHeight: '2.8em', // Reserve space for 2 lines
          }}
        >
          {meeting.meeting_name}
        </Typography>

        {/* Summary */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            level="body-sm" 
            color="neutral"
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            {meeting.summary || 'No summary available'}
          </Typography>
        </Box>


      </CardContent>
    </Card>
  );
} 