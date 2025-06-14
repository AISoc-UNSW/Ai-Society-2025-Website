"use client";

import * as React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Sidebar from "@/components/joyui/Sidebar";
import MyTasks from "@/components/joyui/task/MyTasks";
import { Task, TaskStatus } from "@/lib/types";
import { useTransition } from "react";

interface TaskDashboardClientProps {
  tasks: Task[];
  error?: string;
  updateTaskStatusAction?: (
    taskId: number,
    status: TaskStatus
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function TaskDashboardClient({
  tasks,
  error,
  updateTaskStatusAction,
}: TaskDashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleTaskStatusUpdate = async (taskId: number, status: TaskStatus) => {
    if (!updateTaskStatusAction) return;

    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, status);
      if (!result.success) {
        // Handle error - could show toast notification
        alert(`Failed to update task: ${result.error}`);
      }
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <h1>Error loading tasks</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering MUI components until mounted
  if (!mounted) {
    return (
      <div style={{ padding: "16px" }}>
        <h2>My Tasks Dashboard</h2>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: "background.surface",
            minHeight: "100vh",
          }}
        >
          <MyTasks
            tasks={tasks}
            onTaskStatusUpdate={handleTaskStatusUpdate}
            isUpdating={isPending}
          />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
