"use client";

import { MeetingRecordDetailResponse, PortfolioListResponse, TaskListResponse } from "@/lib/types";
import { ArrowBack } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemContent,
  Typography
} from "@mui/joy";
import { useRouter } from "next/navigation";

interface MeetingDetailClientProps {
  meeting: MeetingRecordDetailResponse;
  relatedTasks: TaskListResponse[];
  portfolios: PortfolioListResponse[];
}

export default function MeetingDetailClient({ 
  meeting, 
  relatedTasks, 
  portfolios 
}: MeetingDetailClientProps) {
  const router = useRouter();

  // Create a portfolio lookup map for efficient name resolution
  const portfolioMap = portfolios.reduce((map, portfolio) => {
    map[portfolio.portfolio_id] = portfolio.name;
    return map;
  }, {} as Record<number, string>);

  const portfolioName = portfolioMap[meeting.portfolio_id] || "Unknown";

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getPortfolioColor = () => {
    return 'primary' as const;
  };

  const getTaskStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success' as const;
      case 'in progress':
        return 'warning' as const;
      case 'cancelled':
        return 'danger' as const;
      case 'pending':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="plain"
          startDecorator={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography level="h1" sx={{ mb: 1 }}>
            {meeting.meeting_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              variant="soft" 
              color={getPortfolioColor()}
              size="sm"
            >
              {portfolioName}
            </Chip>
            <Typography level="body-sm" color="neutral">
              {formatDate(meeting.meeting_date)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Transcript */}
        <Grid xs={12} md={8}>
          <Card variant="outlined" sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>
                Transcript
              </Typography>
              {meeting.auto_caption ? (
                <Typography 
                  level="body-sm" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    maxHeight: '60vh',
                    overflow: 'auto',
                    p: 2,
                    backgroundColor: 'background.level1',
                    borderRadius: 'sm'
                  }}
                >
                  {meeting.auto_caption}
                </Typography>
              ) : (
                <Typography level="body-sm" color="neutral" sx={{ fontStyle: 'italic' }}>
                  No transcript available for this meeting.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Summary and Related Tasks */}
        <Grid xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Meeting Summary */}
            <Card variant="outlined">
              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Meeting Summary
                </Typography>
                {meeting.summary ? (
                  <Typography 
                    level="body-sm" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6 
                    }}
                  >
                    {meeting.summary}
                  </Typography>
                ) : (
                  <Typography level="body-sm" color="neutral" sx={{ fontStyle: 'italic' }}>
                    No summary available for this meeting.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Related Tasks */}
            <Card variant="outlined">
              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Related Tasks
                </Typography>
                {relatedTasks.length > 0 ? (
                  <List size="sm">
                    {relatedTasks.map((task) => (
                      <ListItem 
                        key={task.task_id}
                        sx={{ 
                          borderRadius: 'sm',
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          mb: 1
                        }}
                      >
                        <ListItemContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography level="body-sm" sx={{ fontWeight: 'md', flex: 1 }}>
                              {task.title}
                            </Typography>
                            {task.status && (
                              <Chip 
                                size="sm" 
                                color={getTaskStatusColor(task.status)}
                                variant="soft"
                                sx={{ ml: 1, flexShrink: 0 }}
                              >
                                {task.status}
                              </Chip>
                            )}
                          </Box>
                          {task.description && (
                            <Typography 
                              level="body-xs" 
                              color="neutral"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {task.description}
                            </Typography>
                          )}
                        </ListItemContent>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography level="body-sm" color="neutral" sx={{ fontStyle: 'italic' }}>
                    No related tasks found for this meeting.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 