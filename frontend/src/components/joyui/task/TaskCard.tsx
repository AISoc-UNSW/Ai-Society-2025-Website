"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Divider from "@mui/joy/Divider";
import IconButton from "@mui/joy/IconButton";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { Task, TaskStatus } from "@/lib/types";
import { formatDateSafe } from "@/lib/utils";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import AvatarsList from "../AvatarsList";

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
  const [showDetails, setShowDetails] = React.useState(false);
  const [expandedSubtask, setExpandedSubtask] = React.useState<Task | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle toggle details with subtask fetching
  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        minHeight: showDetails ? "auto" : 220,
        transition: "all 0.2s",
        opacity: isUpdating ? 0.7 : 1,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "md",
          borderColor: "primary.outlinedBorder",
        },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
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
          <Box>
            <Typography
              level="body-sm"
              sx={{
                overflow: showDetails ? "visible" : "hidden",
                display: showDetails ? "block" : "-webkit-box",
                WebkitLineClamp: showDetails ? "none" : 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.4,
              }}
            >
              {task.description}
            </Typography>
            {task.description.length > 100 && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <Typography
                  level="body-xs"
                  color="primary"
                  sx={{ cursor: "pointer", flex: 1 }}
                  onClick={handleToggleDetails}
                >
                  {showDetails ? "Show less details" : "Show more details..."}
                </Typography>
                <IconButton
                  variant="plain"
                  size="sm"
                  color="primary"
                  onClick={handleToggleDetails}
                  sx={{ ml: 1 }}
                >
                  <KeyboardArrowDown
                    sx={{
                      transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Expanded Details */}
          {showDetails && (
            <Box
              sx={{
                opacity: showDetails ? 1 : 0,
                maxHeight: showDetails ? "1000px" : "0px",
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
                maxWidth: "100%",
              }}
            >
              <Stack spacing={2}>
                <Divider />

                {/* Task Metadata */}
                <Stack spacing={1}>
                  <Typography level="body-xs" sx={{ fontWeight: "bold", color: "neutral.700" }}>
                    Task Details
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    <Typography level="body-xs" color="neutral">
                      Created: {mounted ? formatDateSafe(task.created_at) : "Loading..."}
                    </Typography>
                    <Typography level="body-xs" color="neutral">
                      Updated: {mounted ? formatDateSafe(task.updated_at) : "Loading..."}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <>
                    <Stack spacing={1}>
                      <Typography level="body-xs" sx={{ fontWeight: "bold", color: "neutral.700" }}>
                        Subtasks ({task.subtasks.length})
                      </Typography>
                      <Stack spacing={1}>
                        {task.subtasks.map(subtask => (
                          <Box
                            key={subtask.id}
                            onClick={() => setExpandedSubtask(subtask)}
                            sx={{
                              p: 1.5,
                              borderRadius: "sm",
                              backgroundColor: "background.level1",
                              border: "1px solid",
                              borderColor: "divider",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              width: "100%",
                              maxWidth: "100%",
                              overflow: "hidden",
                              "&:hover": {
                                backgroundColor: "background.level2",
                                borderColor: "primary.outlinedBorder",
                                boxShadow: "sm",
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems: "center",
                                width: "100%",
                                maxWidth: "100%",
                                overflow: "hidden",
                              }}
                            >
                              <Chip size="sm" variant="soft" color={getStatusColor(subtask.status)}>
                                {subtask.status}
                              </Chip>
                              <Typography
                                level="body-xs"
                                sx={{
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  minWidth: 0,
                                }}
                              >
                                {subtask.title}
                              </Typography>
                              <Chip
                                size="sm"
                                variant="outlined"
                                color={getPriorityColor(subtask.priority)}
                              >
                                {subtask.priority}
                              </Chip>
                            </Stack>
                            {subtask.description && (
                              <Typography
                                level="body-xs"
                                color="neutral"
                                sx={{
                                  mt: 0.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {subtask.description}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Stack>

                    {/* subtask details modal */}
                    <Modal open={!!expandedSubtask} onClose={() => setExpandedSubtask(null)}>
                      <ModalDialog
                        variant="outlined"
                        size="lg"
                        sx={{
                          maxWidth: "800px",
                          width: "95%",
                          maxHeight: "90vh",
                          overflow: "auto",
                          padding: 0,
                        }}
                      >
                        {expandedSubtask && (
                          <TaskCard
                            task={expandedSubtask}
                            onStatusUpdate={onStatusUpdate}
                            isUpdating={isUpdating}
                          />
                        )}
                      </ModalDialog>
                    </Modal>
                  </>
                )}
              </Stack>
            </Box>
          )}

          {/* Assignees and Creator */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={5}
            sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
          >
            {/* Assignees */}
            <AvatarsList
              label="Assigned to:"
              users={task.assignees.map(assignee => ({
                id: assignee.id,
                name: assignee.name,
                email: assignee.email,
                avatar: assignee.avatar,
              }))}
              showGroup={true}
            />

            {/* Creator */}
            <AvatarsList
              label="Created by:"
              users={[
                {
                  id: task.created_by.user_id,
                  username: task.created_by.username,
                  email: task.created_by.email,
                },
              ]}
              showGroup={false}
            />
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
