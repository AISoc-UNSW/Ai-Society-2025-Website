"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { Task, TaskStatus } from "@/lib/types";
import TaskCard from "../TaskCard";

interface MyTasksProps {
  tasks: Task[];
  onTaskStatusUpdate?: (taskId: number, status: TaskStatus) => Promise<void>;
  isUpdating?: boolean;
}

export default function MyTasks({ tasks, onTaskStatusUpdate, isUpdating = false }: MyTasksProps) {
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

  return (
    <>
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
              You don&apos;t have any tasks assigned to you at the moment.
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
