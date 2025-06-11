"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sidebar from "@/components/joyui/Sidebar";
import MyTasks from "@/components/joyui/MyTasks";
import { CssBaseline, CssVarsProvider } from "@mui/joy";
import { Task } from "@/lib/types";
import { getAccessToken } from "@/lib/utils";

// API response interface based on the documentation
interface UserTaskAssignment {
  assignment_id: number;
  task_id: number;
  task_title: string;
  task_status: string;
  task_priority: string;
  task_deadline: string;
}

// API base URL - you may need to set this as an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Simple API service for this specific endpoint
const getUserTasks = async (): Promise<UserTaskAssignment[]> => {
  const url = `${API_BASE_URL}/api/v1/task-assignments/user/me/tasks`;

  // Get access token from cookie
  const accessToken = getAccessToken();

  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    // Add Authorization header if token exists
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include", // Include cookies in the request
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }

      throw new Error(
        `Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // More specific error handling
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Unable to connect to the API server. This might be a CORS issue or the server is not running."
      );
    }

    throw error;
  }
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

        // Check if access token exists
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error("No access token found. Please log in first.");
        }

        // Fetch user's assigned tasks directly
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
                Connecting to API at: {API_BASE_URL}
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
              <Typography level="body-sm" color="neutral">
                API URL: {API_BASE_URL}/api/v1/task-assignments/user/me/tasks
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
