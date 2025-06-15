"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import { Task, TaskStatus } from "@/lib/types";
import { formatDateSafe, getEmailInitials, getEmailAvatarColor } from "@/lib/utils";
import Tooltip from "@mui/joy/Tooltip";

// Status color mapping for Chips
const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "Completed":
      return "success";
    case "In Progress":
      return "warning";
    case "Not Started":
      return "neutral";
    case "Cancelled":
      return "danger";
    default:
      return "neutral";
  }
};

// Priority color mapping for Chips
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "primary";
    case "Low":
      return "neutral";
    default:
      return "neutral";
  }
};

// Status options for dropdown
const statusOptions: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"];

// Task Card Component Props
interface TaskCardProps {
  task: Task;
  onStatusUpdate: (task: Task, newStatus: TaskStatus) => void;
  isUpdating?: boolean;
}

export default function TaskCard({ task, onStatusUpdate, isUpdating = false }: TaskCardProps) {
  // Add a mounted state to prevent hydration issues
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card
      variant="outlined"
      sx={{
        minHeight: 220,
        transition: "all 0.2s",
        opacity: isUpdating ? 0.7 : 1,
        "&:hover": {
          boxShadow: "md",
          borderColor: "primary.outlinedBorder",
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={2}>
          {/* Task Header */}
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ flex: 1 }}>
              <Typography level="title-md" sx={{ fontWeight: "lg" }}>
                {task.title}
              </Typography>
              <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
                {task.portfolio}
              </Typography>
            </Box>
            <Chip size="sm" variant="soft" color={getPriorityColor(task.priority)}>
              {task.priority}
            </Chip>
          </Stack>

          {/* Task Description */}
          <Typography
            level="body-sm"
            sx={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4,
            }}
          >
            {task.description}
          </Typography>

          {/* Assignees */}
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", gap: 1 }}>
            <Typography level="body-xs" color="neutral">
              Assigned to:
            </Typography>
            <AvatarGroup size="sm" sx={{ "--AvatarGroup-gap": "-8px" }}>
              {task.assignees.map(assignee => (
                <Tooltip key={assignee.id} title={assignee.name}>
                  <Avatar
                    key={assignee.id}
                    src={assignee.avatar}
                    size="sm"
                    alt={assignee.name}
                    aria-label={assignee.name}
                    sx={{
                      // If no avatar image, use email initials with custom background
                      backgroundColor: !assignee.avatar
                        ? getEmailAvatarColor(assignee.email)
                        : undefined,
                      color: !assignee.avatar ? "white" : undefined,
                      fontWeight: "bold",
                    }}
                  >
                    {!assignee.avatar && getEmailInitials(assignee.email)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Stack>

          {/* Due Date - Fixed to prevent hydration issues */}
          <Typography level="body-xs" color="neutral">
            Due: {mounted ? formatDateSafe(task.deadline) : "Loading..."}
          </Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center" }}>
          <Chip variant="soft" color={getStatusColor(task.status)} size="sm">
            {task.status}
          </Chip>
          <Box sx={{ flex: 1 }} />
          <Select
            value={task.status}
            onChange={(_, newValue) => {
              if (newValue && !isUpdating) {
                onStatusUpdate(task, newValue as TaskStatus);
              }
            }}
            size="sm"
            color={getStatusColor(task.status)}
            variant="outlined"
            disabled={isUpdating}
            sx={{ minWidth: { xs: 100, sm: 120 } }}
          >
            {statusOptions.map(status => (
              <Option key={status} value={status}>
                <Chip size="sm" variant="soft" color={getStatusColor(status)} sx={{ mr: 1 }}>
                  {status}
                </Chip>
              </Option>
            ))}
          </Select>
        </Stack>
      </CardActions>
    </Card>
  );
}
