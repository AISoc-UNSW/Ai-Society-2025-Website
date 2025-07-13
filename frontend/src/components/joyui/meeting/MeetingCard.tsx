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
    switch (portfolio.toLowerCase()) {
      case 'product':
        return 'primary';
      case 'marketing':
        return 'success';
      case 'finance':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 'md',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography level="title-md" sx={{ fontWeight: 'bold' }}>
            {meeting.meeting_name}
          </Typography>
          <Chip 
            variant="soft" 
            color={getPortfolioColor(portfolioName)}
            size="sm"
          >
            {portfolioName}
          </Chip>
        </Box>
        
        <Typography level="body-sm" color="neutral" sx={{ mb: 2 }}>
          {formatDate(meeting.meeting_date)}
        </Typography>
        
        {meeting.summary && (
          <Typography 
            level="body-sm" 
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4
            }}
          >
            {meeting.summary}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {meeting.has_recording && (
            <Chip variant="soft" color="success" size="sm">
              Recording
            </Chip>
          )}
          {meeting.has_summary && (
            <Chip variant="soft" color="primary" size="sm">
              Summary
            </Chip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
} 