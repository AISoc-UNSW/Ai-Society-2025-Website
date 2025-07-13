"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { Task, TaskStatus, User } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Tab, TabList, Tabs } from "@mui/joy";

interface TasksProps {
  myTasks?: boolean;
  directorPortfolioId?: number;
  admin?: boolean;
  tasks: Task[];
  onTaskStatusUpdate?: (taskId: number, status: TaskStatus) => Promise<void>;
  isUpdating?: boolean;
  updateTaskAction?: (
    taskId: number,
    updates: Partial<Task>
  ) => Promise<{ success: boolean; error?: string }>;
  searchUsersAction?: (searchTerm: string) => Promise<User[]>;
  updateTaskAssignmentAction?: (
    taskId: number,
    userIds: number[]
  ) => Promise<{ success: boolean; error?: string }>;
  headerActions?: React.ReactNode;
  currentStatus?: string;
  handleStatusChange?: (
    event: React.SyntheticEvent | null,
    newValue: string | number | null
  ) => void;
}

export default function Tasks({
  directorPortfolioId,
  admin = false,
  tasks,
  onTaskStatusUpdate,
  isUpdating = false,
  updateTaskAction,
  searchUsersAction,
  updateTaskAssignmentAction,
  headerActions,
  currentStatus,
}: TasksProps) {
  // Local state for tab filtering
  const [tabFilter, setTabFilter] = React.useState<string>("all");

  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    if (onTaskStatusUpdate) {
      await onTaskStatusUpdate(task.id, newStatus);
    }
  };

  // Filter tasks based on tab selection
  const filteredTasks = React.useMemo(() => {
    // For created-tasks, don't apply tab filtering
    if (currentStatus === "created-tasks") {
      return tasks;
    }

    // Apply tab filtering for my-tasks and all tasks
    switch (tabFilter) {
      case "not-started":
        return tasks.filter(task => task.status === "Not Started");
      case "in-progress":
        return tasks.filter(task => task.status === "In Progress");
      case "completed":
        return tasks.filter(task => task.status === "Completed");
      case "cancelled":
        return tasks.filter(task => task.status === "Cancelled");
      default:
        return tasks;
    }
  }, [tasks, tabFilter, currentStatus]);

  // Sort tasks by status priority: In Progress -> Not Started -> Completed -> Cancelled
  const sortedTasks = React.useMemo(() => {
    const statusOrder: Record<TaskStatus, number> = {
      "In Progress": 0,
      "Not Started": 1,
      Completed: 2,
      Cancelled: 3,
      Pending: 0,
    };

    return [...filteredTasks].sort((a, b) => {
      const aOrder = statusOrder[a.status];
      const bOrder = statusOrder[b.status];

      // Primary sort by status
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Secondary sort by deadline (earliest first) for tasks with same status
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [filteredTasks]);

  const totalTasks = filteredTasks.length;
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress").length;
  const completedTasks = filteredTasks.filter(t => t.status === "Completed").length;

  // Determine the display mode based on current view
  const getDisplayTitle = () => {
    if (currentStatus === "created-tasks") return "Tasks Created by Me";
    if (currentStatus === "my-tasks") return "My Tasks";
    if (directorPortfolioId) return "Your Portfolio's Tasks";
    if (currentStatus === "all") return "All Tasks";
    if (admin) return "All Tasks";
    return "Tasks";
  };

  const getDisplayDescription = () => {
    if (currentStatus === "created-tasks") return "View and manage tasks you have created";
    if (currentStatus === "my-tasks") return "View and manage your assigned tasks";
    if (currentStatus === "all") return "View and manage all tasks in the system";
    if (directorPortfolioId) return "View and manage your portfolio's tasks";
    if (admin) return "View and manage all tasks";
    return "View and manage tasks";
  };

  const getEmptyStateMessage = () => {
    if (currentStatus === "created-tasks") return "You haven't created any tasks yet.";
    if (currentStatus === "my-tasks")
      return "You don't have any tasks assigned to you at the moment.";
    if (currentStatus === "all") return "No tasks found in the system.";
    if (directorPortfolioId)
      return "You don't have any tasks assigned to your portfolio at the moment.";
    if (admin) return "No tasks found.";
    return "No tasks found.";
  };

  // Handle tab changes for local filtering
  const handleTabChange = (
    event: React.SyntheticEvent | null,
    newValue: string | number | null
  ) => {
    if (typeof newValue === "string") {
      setTabFilter(newValue);
    }
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography level="h2" sx={{ mb: 1 }}>
            {getDisplayTitle()}
          </Typography>
          <Typography level="body-md" color="neutral">
            {getDisplayDescription()}
          </Typography>
        </Box>
        {headerActions && <Box sx={{ display: "flex", alignItems: "center" }}>{headerActions}</Box>}
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

      {/* Status Filter Tabs - only show for filtering, not for created-tasks view */}
      {currentStatus !== "created-tasks" && (
        <Box sx={{ mb: 2 }}>
          <Tabs value={tabFilter} onChange={handleTabChange}>
            <TabList>
              <Tab value="all">All Tasks</Tab>
              <Tab value="in-progress">In Progress</Tab>
              <Tab value="completed">Completed</Tab>
              <Tab value="not-started">Not Started</Tab>
              <Tab value="cancelled">Cancelled</Tab>
            </TabList>
          </Tabs>
        </Box>
      )}

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
              updateTaskAction={updateTaskAction}
              searchUsersAction={searchUsersAction}
              updateTaskAssignmentAction={updateTaskAssignmentAction}
            />
          ))}
        </Box>
      ) : (
        <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <CardContent>
            <Typography level="h4" sx={{ mb: 2 }}>
              No Tasks Found
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
