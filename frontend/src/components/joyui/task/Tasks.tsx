"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { TaskResponse, TaskStatus, User } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Tab, TabList, Tabs } from "@mui/joy";

interface TasksProps {
  myTasks?: boolean;
  directorPortfolioId?: number;
  admin?: boolean;
  tasks: TaskResponse[];
  onTaskStatusUpdate?: (taskId: number, status: TaskStatus) => Promise<void>;
  isUpdating?: boolean;
  updateTaskAction?: (
    taskId: number,
    updates: Partial<TaskResponse>
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
  const [tabFilter, setTabFilter] = React.useState<string>("active");

  const handleStatusUpdate = async (task: TaskResponse, newStatus: TaskStatus) => {
    if (onTaskStatusUpdate) {
      await onTaskStatusUpdate(task.task_id, newStatus);
    }
  };

  // Filter tasks based on tab selection
  const filteredTasks = React.useMemo(() => {
    // First filter to only include tasks with valid statuses
    const validStatuses: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"];
    const tasksWithValidStatus = tasks.filter(task =>
      validStatuses.includes(task.status as TaskStatus)
    );

    // Then apply tab filtering
    switch (tabFilter) {
      case "active":
        return tasksWithValidStatus.filter(
          task => task.status === "In Progress" || task.status === "Not Started"
        );
      case "not-started":
        return tasksWithValidStatus.filter(task => task.status === "Not Started");
      case "in-progress":
        return tasksWithValidStatus.filter(task => task.status === "In Progress");
      case "completed":
        return tasksWithValidStatus.filter(task => task.status === "Completed");
      case "cancelled":
        return tasksWithValidStatus.filter(task => task.status === "Cancelled");
      default:
        return tasksWithValidStatus;
    }
  }, [tasks, tabFilter]);

  // Sort tasks by status priority: In Progress -> Not Started -> Completed -> Cancelled
  const sortedTasks = React.useMemo(() => {
    const statusOrder: Record<TaskStatus, number> = {
      "In Progress": 0,
      "Not Started": 1,
      Completed: 2,
      Cancelled: 3,
      Pending: 4,
    };

    return [...filteredTasks].sort((a, b) => {
      const aOrder = statusOrder[a.status as TaskStatus];
      const bOrder = statusOrder[b.status as TaskStatus];

      // Primary sort by status
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Secondary sort by deadline (earliest first) for tasks with same status
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [filteredTasks]);

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;

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

  // Add function to get tab-specific empty messages
  const getTabEmptyStateMessage = () => {
    switch (tabFilter) {
      case "active":
        return "No active tasks found. Active tasks include those that are 'Not Started' or 'In Progress'.";
      case "not-started":
        return "No tasks with 'Not Started' status found.";
      case "in-progress":
        return "No tasks with 'In Progress' status found.";
      case "completed":
        return "No completed tasks found.";
      case "cancelled":
        return "No cancelled tasks found.";
      default:
        return "No tasks found for the selected filter.";
    }
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
        <Card
          variant="soft"
          color="primary"
          sx={{
            flex: 1,
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <CardContent>
            <Typography level="body-sm" color="primary">
              Total Tasks
            </Typography>
            <Typography level="h3" color="primary">
              {totalTasks}
            </Typography>
          </CardContent>
        </Card>
        <Card
          variant="soft"
          color="warning"
          sx={{
            flex: 1,
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <CardContent>
            <Typography level="body-sm">In Progress</Typography>
            <Typography level="h3">{inProgressTasks}</Typography>
          </CardContent>
        </Card>
        <Card
          variant="soft"
          color="success"
          sx={{
            flex: 1,
            minWidth: 0,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <CardContent>
            <Typography level="body-sm">Completed</Typography>
            <Typography level="h3">{completedTasks}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Status Filter Tabs */}
      <Box sx={{ mb: 2, width: "100%", overflow: "hidden" }}>
        <Tabs
          value={tabFilter}
          onChange={handleTabChange}
          sx={{
            width: "100%",
          }}
        >
          <TabList
            sx={{
              overflow: "auto",
              scrollSnapType: "x mandatory",
              "&::-webkit-scrollbar": { display: "none" },
              display: "flex",
              flexWrap: "nowrap",
              width: "100%",
            }}
          >
            <Tab
              value="active"
              sx={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                px: 2,
              }}
            >
              Active Tasks
            </Tab>
            <Tab
              value="in-progress"
              sx={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                px: 2,
              }}
            >
              In Progress
            </Tab>
            <Tab
              value="not-started"
              sx={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                px: 2,
              }}
            >
              Not Started
            </Tab>
            <Tab
              value="completed"
              sx={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                px: 2,
              }}
            >
              Completed
            </Tab>
            <Tab
              value="cancelled"
              sx={{
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                whiteSpace: "nowrap",
                minWidth: "fit-content",
                px: 2,
              }}
            >
              Cancelled
            </Tab>
          </TabList>
        </Tabs>
      </Box>

      {/* Tasks Grid or Empty State */}
      {sortedTasks.length > 0 ? (
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
              key={task.task_id}
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
              {totalTasks === 0 ? getEmptyStateMessage() : getTabEmptyStateMessage()}
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
