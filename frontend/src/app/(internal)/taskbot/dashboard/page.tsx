"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sidebar from "@/components/joyui/Sidebar";
import MyTasks from "@/components/joyui/MyTasks";
import { CssBaseline, CssVarsProvider } from "@mui/joy";
import { Task, UserTaskAssignment } from "@/lib/types";
import { getAccessToken } from "@/lib/utils";
import { taskApi } from "@/lib/api/taskService";

// Simple API service using our internal API route
const getUserTasks = async (): Promise<UserTaskAssignment[]> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("No access token found. Please log in first.");
  }

  return await taskApi.getUserTasks(accessToken);
};

// Transform API response to our Task interface
const transformUserTaskToTask = (userTask: UserTaskAssignment): Task => {
  // Map API status values to our TaskStatus type
  const mapStatusToTaskStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "not started":
      case "not_started":
        return "Not Started" as const;
      case "in progress":
      case "in_progress":
        return "In Progress" as const;
      case "completed":
        return "Completed" as const;
      case "cancelled":
        return "Cancelled" as const;
      default:
        return "Not Started" as const;
    }
  };

  // Map API priority values to our PriorityLevel type
  const mapPriorityToPriorityLevel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "low":
        return "Low" as const;
      case "medium":
        return "Medium" as const;
      case "high":
        return "High" as const;
      case "critical":
        return "Critical" as const;
      default:
        return "Medium" as const;
    }
  };

  return {
    id: userTask.task_id.toString(),
    title: userTask.task_title,
    department: "Engineering" as const, // Default department
    assignees: [], // Could be populated if needed
    description: userTask.task_title, // Using title as description
    source: "API",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priority: mapPriorityToPriorityLevel(userTask.task_priority),
    dueDate: userTask.task_deadline,
    status: mapStatusToTaskStatus(userTask.task_status),
    subtasks: [], // Empty for now
  };
};

export default function TaskDashboard() {
  const [userTasks, setUserTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's assigned tasks via our API route
        const apiTasks = await getUserTasks();

        // Transform API tasks to our Task interface
        const transformedTasks = apiTasks.map(transformUserTaskToTask);

        setUserTasks(transformedTasks);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <CssVarsProvider disableTransitionOnChange>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flex: 1,
              p: 3,
              backgroundColor: "background.surface",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography level="h4">Loading tasks...</Typography>
              <Typography level="body-md" sx={{ mt: 1 }}>
                Fetching your assigned tasks...
              </Typography>
            </Box>
          </Box>
        </Box>
      </CssVarsProvider>
    );
  }

  if (error) {
    return (
      <CssVarsProvider disableTransitionOnChange>
        <CssBaseline />
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flex: 1,
              p: 3,
              backgroundColor: "background.surface",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box sx={{ textAlign: "center", maxWidth: 600 }}>
              <Typography level="h4" color="danger">
                Error Loading Tasks
              </Typography>
              <Typography level="body-md" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Typography>
              {error.includes("No access token") && (
                <Typography level="body-sm" color="warning" sx={{ mt: 1 }}>
                  Please log in to access your tasks.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CssVarsProvider>
    );
  }

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
          <MyTasks tasks={userTasks} />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
