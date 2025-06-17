"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { Task, TaskStatus } from "@/lib/types";
import TaskCard from "./TaskCard";

interface TasksProps {
  myTasks?: boolean;
  directorPortfolioId?: number;
  admin?: boolean;
  tasks: Task[];
  onTaskStatusUpdate?: (taskId: number, status: TaskStatus) => Promise<void>;
  isUpdating?: boolean;
}

export default function Tasks({
  myTasks = false,
  directorPortfolioId = undefined,
  admin = false,
  tasks,
  onTaskStatusUpdate,
  isUpdating = false,
}: TasksProps) {
  console.log("tasks", tasks);
  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    if (onTaskStatusUpdate) {
      await onTaskStatusUpdate(task.id, newStatus);
    }
  };

  // Sort tasks by status priority: In Progress -> Not Started -> Completed -> Cancelled
  const sortedTasks = React.useMemo(() => {
    const statusOrder: Record<TaskStatus, number> = {
      "In Progress": 0,
      "Not Started": 1,
      Completed: 2,
      Cancelled: 3,
      Pending: 0,
    };

    return [...tasks].sort((a, b) => {
      const aOrder = statusOrder[a.status];
      const bOrder = statusOrder[b.status];

      // Primary sort by status
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Secondary sort by deadline (earliest first) for tasks with same status
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks]);

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;

  // Determine the display mode based on role hierarchy
  const getDisplayTitle = () => {
    if (directorPortfolioId) return "Your portfolio's Tasks";
    if (admin) return "All Tasks";
    if (myTasks) return "My Tasks";
    return "Tasks";
  };

  const getDisplayDescription = () => {
    if (directorPortfolioId) return "View and manage your portfolio's tasks";
    if (admin) return "View and manage all tasks";
    if (myTasks) return "View and manage your assigned tasks";
    return "View and manage tasks";
  };

  const getEmptyStateMessage = () => {
    if (directorPortfolioId)
      return "You don't have any tasks assigned to your portfolio at the moment.";
    if (admin) return "No tasks found.";
    if (myTasks) return "You don't have any tasks assigned to you at the moment.";
    return "No tasks found.";
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography level="h2" sx={{ mb: 1 }}>
          {getDisplayTitle()}
        </Typography>
        <Typography level="body-md" color="neutral">
          {getDisplayDescription()}
        </Typography>
      </Box>

      {/* Task Stats */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <Card variant="soft" color="primary" sx={{ flex: 1, minWidth: { xs: "auto", sm: 120 } }}>
          <CardContent>
            <Typography level="body-sm" color="primary">
              Total Tasks
            </Typography>
            <Typography level="h3" color="primary">
              {totalTasks}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="soft" color="warning" sx={{ flex: 1, minWidth: { xs: "auto", sm: 120 } }}>
          <CardContent>
            <Typography level="body-sm">In Progress</Typography>
            <Typography level="h3">{inProgressTasks}</Typography>
          </CardContent>
        </Card>
        <Card variant="soft" color="success" sx={{ flex: 1, minWidth: { xs: "auto", sm: 120 } }}>
          <CardContent>
            <Typography level="body-sm">Completed</Typography>
            <Typography level="h3">{completedTasks}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Tasks Grid or Empty State */}
      {totalTasks > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={isUpdating}
            />
          ))}
        </Box>
      ) : (
        <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <CardContent>
            <Typography level="h4" sx={{ mb: 2 }}>
              No Tasks Assigned
            </Typography>
            <Typography level="body-md" color="neutral">
              {getEmptyStateMessage()}
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
