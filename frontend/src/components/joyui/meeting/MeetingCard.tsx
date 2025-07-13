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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        height: '190px',
        '&:hover': {
          boxShadow: 'md',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1
      }}>
        {/* Header: Portfolio and Date */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 0.5
        }}>
          <Chip
            color="primary"
            size="sm"
            variant="soft"
          >
            {portfolioName}
          </Chip>
          <Typography 
            level="body-xs" 
            color="neutral"
            sx={{ fontSize: '0.75rem' }}
          >
            {formatDate(meeting.meeting_date)}
          </Typography>
        </Box>

        {/* Meeting Title */}
        <Typography 
          level="title-md"
          sx={{ 
            fontWeight: 'bold',
            lineHeight: 1.2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mb: 1
          }}
        >
          {meeting.meeting_name}
        </Typography>

        {/* Summary */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography 
            level="body-sm" 
            color="neutral"
            sx={{ 
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.875rem'
            }}
          >
            {meeting.summary || 'No summary available'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 