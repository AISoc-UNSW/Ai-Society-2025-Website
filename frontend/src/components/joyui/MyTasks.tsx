"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { Task, TaskStatus } from "@/lib/types";
import TaskCard from "./TaskCard";

// Status update function (simulated)
const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
  console.log(`Updating task ${taskId} to status: ${newStatus}`);
  // In a real app, this would make an API call
};

interface MyTasksProps {
  tasks: Task[];
}

export default function MyTasks({ tasks }: MyTasksProps) {
  const handleStatusUpdate = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
    // In a real app, you would update the task state here
    // For now, we'll just log it
  };

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
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Card variant="soft" color="primary" sx={{ minWidth: 120 }}>
          <CardContent>
            <Typography level="body-sm" color="primary">
              Total Tasks
            </Typography>
            <Typography level="h3" color="primary">
              {tasks.length}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="soft" color="warning" sx={{ minWidth: 120 }}>
          <CardContent>
            <Typography level="body-sm">In Progress</Typography>
            <Typography level="h3">
              {tasks.filter(t => t.status === "In Progress").length}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="soft" color="success" sx={{ minWidth: 120 }}>
          <CardContent>
            <Typography level="body-sm">Completed</Typography>
            <Typography level="h3">{tasks.filter(t => t.status === "Completed").length}</Typography>
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
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdate} />
        ))}
      </Box>
    </>
  );
}
