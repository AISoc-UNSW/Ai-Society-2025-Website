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
    ListItemButton,
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

  const handleTaskClick = (taskId: number) => {
    router.push(`/taskbot/tasks/${taskId}`);
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
              color={getPortfolioColor(portfolioName)}
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
                      <ListItem key={task.task_id}>
                        <ListItemButton
                          onClick={() => handleTaskClick(task.task_id)}
                          sx={{ 
                            borderRadius: 'sm',
                            '&:hover': {
                              backgroundColor: 'background.level2'
                            }
                          }}
                        >
                          <ListItemContent>
                            <Typography level="body-sm" sx={{ fontWeight: 'md' }}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography 
                                level="body-xs" 
                                color="neutral"
                                sx={{ 
                                  mt: 0.5,
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
                        </ListItemButton>
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