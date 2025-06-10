"use client";

import * as React from "react";
import { useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Chip from "@mui/joy/Chip";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import ModalClose from "@mui/joy/ModalClose";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import Divider from "@mui/joy/Divider";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sidebar from "@/components/joyui/Sidebar";
import { tasks } from "@/lib/data";
import { Task, TaskStatus } from "@/lib/types";
import { CssBaseline, CssVarsProvider } from "@mui/joy";
import { formatDate } from "@/lib/utils";

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

// Status update function (simulated)
const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
  console.log(`Updating task ${taskId} to status: ${newStatus}`);
  // In a real app, this would make an API call
};

// Status options for quick updates
const statusOptions: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"];

export default function TaskDashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter tasks to show only current user's tasks (simplified - in real app, filter by user ID)
  const userTasks = tasks;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
    // In a real app, you would update the task state here
    // For now, we'll just log it
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      variant="outlined"
      sx={{
        minHeight: 280,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "md",
          borderColor: "primary.outlinedBorder",
        },
      }}
      onClick={() => handleTaskClick(task)}
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
                {task.department}
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
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4,
            }}
          >
            {task.description}
          </Typography>

          {/* Assignees */}
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography level="body-xs" color="neutral">
              Assigned to:
            </Typography>
            <AvatarGroup size="sm" sx={{ "--AvatarGroup-gap": "-8px" }}>
              {task.assignees.map(assignee => (
                <Avatar key={assignee.id} src={assignee.avatar} size="sm" alt={assignee.name} />
              ))}
            </AvatarGroup>
          </Stack>

          {/* Due Date */}
          <Typography level="body-xs" color="neutral">
            Due: {formatDate(task.dueDate)}
          </Typography>

          {/* Subtasks Progress */}
          {task.subtasks.length > 0 && (
            <Box>
              <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                Subtasks: {task.subtasks.filter(st => st.status === "Completed").length}/
                {task.subtasks.length} completed
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: 4,
                  backgroundColor: "neutral.200",
                  borderRadius: "sm",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${(task.subtasks.filter(st => st.status === "Completed").length / task.subtasks.length) * 100}%`,
                    height: "100%",
                    backgroundColor: "success.400",
                    transition: "width 0.3s",
                  }}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center" }}>
          <Chip variant="soft" color={getStatusColor(task.status)} size="sm">
            {task.status}
          </Chip>
          <Box sx={{ flex: 1 }} />
          <Button
            size="sm"
            variant="soft"
            onClick={e => {
              e.stopPropagation();
              handleTaskClick(task);
            }}
          >
            View Details
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            backgroundColor: "background.surface",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" sx={{ mb: 1 }}>
              My Tasks Dashboard
            </Typography>
            <Typography level="body-md" color="neutral">
              View and manage your assigned tasks
            </Typography>
          </Box>

          {/* Task Stats */}
          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            <Card variant="soft" color="primary" sx={{ minWidth: 120 }}>
              <CardContent>
                <Typography level="body-sm" color="primary">
                  Total Tasks
                </Typography>
                <Typography level="h3" color="primary">
                  {userTasks.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="warning" sx={{ minWidth: 120 }}>
              <CardContent>
                <Typography level="body-sm">In Progress</Typography>
                <Typography level="h3">
                  {userTasks.filter(t => t.status === "In Progress").length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ minWidth: 120 }}>
              <CardContent>
                <Typography level="body-sm">Completed</Typography>
                <Typography level="h3">
                  {userTasks.filter(t => t.status === "Completed").length}
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Tasks Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {userTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Box>

          {/* Task Detail Modal */}
          <Modal open={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
            <ModalDialog
              variant="outlined"
              sx={{
                maxWidth: 600,
                width: "90vw",
                maxHeight: "90vh",
                overflow: "auto",
              }}
            >
              <ModalClose />
              {selectedTask && (
                <>
                  <DialogTitle>{selectedTask.title}</DialogTitle>
                  <DialogContent>
                    <Stack spacing={3}>
                      {/* Task Info */}
                      <Stack direction="row" spacing={2}>
                        <Chip variant="soft" color={getStatusColor(selectedTask.status)}>
                          {selectedTask.status}
                        </Chip>
                        <Chip variant="soft" color={getPriorityColor(selectedTask.priority)}>
                          {selectedTask.priority} Priority
                        </Chip>
                      </Stack>

                      <Box>
                        <Typography level="title-sm" sx={{ mb: 1 }}>
                          Description
                        </Typography>
                        <Typography level="body-sm">{selectedTask.description}</Typography>
                      </Box>

                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography level="title-sm" sx={{ mb: 1 }}>
                            Department
                          </Typography>
                          <Typography level="body-sm">{selectedTask.department}</Typography>
                        </Box>
                        <Box>
                          <Typography level="title-sm" sx={{ mb: 1 }}>
                            Due Date
                          </Typography>
                          <Typography level="body-sm">
                            {formatDate(selectedTask.dueDate)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box>
                        <Typography level="title-sm" sx={{ mb: 1 }}>
                          Assigned To
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {selectedTask.assignees.map(assignee => (
                            <Stack
                              key={assignee.id}
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center" }}
                            >
                              <Avatar src={assignee.avatar} size="sm" alt={assignee.name} />
                              <Typography level="body-sm">{assignee.name}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>

                      {/* Status Update */}
                      <Box>
                        <Typography level="title-sm" sx={{ mb: 2 }}>
                          Update Status
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                          {statusOptions.map(status => (
                            <Button
                              key={status}
                              size="sm"
                              variant={selectedTask.status === status ? "solid" : "outlined"}
                              color={getStatusColor(status)}
                              onClick={() => handleStatusUpdate(selectedTask, status)}
                            >
                              {status}
                            </Button>
                          ))}
                        </Stack>
                      </Box>

                      {/* Subtasks */}
                      {selectedTask.subtasks.length > 0 && (
                        <>
                          <Divider />
                          <Box>
                            <Typography level="title-sm" sx={{ mb: 2 }}>
                              Subtasks ({selectedTask.subtasks.length})
                            </Typography>
                            <List size="sm">
                              {selectedTask.subtasks.map(subtask => (
                                <ListItem key={subtask.id}>
                                  <ListItemDecorator>
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      color={getStatusColor(subtask.status)}
                                    >
                                      {subtask.status === "Completed" ? "✓" : "○"}
                                    </Chip>
                                  </ListItemDecorator>
                                  <ListItemContent>
                                    <Typography level="body-sm">{subtask.title}</Typography>
                                    <Typography level="body-xs" color="neutral">
                                      Due: {formatDate(subtask.dueDate)}
                                    </Typography>
                                  </ListItemContent>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </DialogContent>
                </>
              )}
            </ModalDialog>
          </Modal>
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
