"use client";

import * as React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Alert from "@mui/joy/Alert";
import CircularProgress from "@mui/joy/CircularProgress";
import Sidebar from "@/components/joyui/Sidebar";
import TaskConfirmationList from "./TaskConfirmationList";
import { TaskResponse, TaskUpdateRequest, TaskCreateRequest, HierarchicalTask } from "@/lib/types";
import { useTransition } from "react";

interface TaskConfirmationClientProps {
  meetingId: number;
  initialTasks: TaskResponse[];
  error?: string;
  updateTaskAction: (
    taskId: number,
    updates: TaskUpdateRequest
  ) => Promise<{ success: boolean; error?: string }>;
  createTaskAction: (
    taskData: TaskCreateRequest
  ) => Promise<{ success: boolean; task?: TaskResponse; error?: string }>;
  deleteTaskAction: (
    taskId: number
  ) => Promise<{ success: boolean; error?: string }>;
  confirmAllTasksAction: (
    meetingId: number
  ) => Promise<{ success: boolean; confirmedCount?: number; error?: string }>;
}

// Transform flat task list to hierarchical structure
function buildTaskHierarchy(tasks: TaskResponse[]): HierarchicalTask[] {
  const taskMap = new Map<number, HierarchicalTask>();
  const rootTasks: HierarchicalTask[] = [];

  // First pass: create all task objects
  tasks.forEach(task => {
    taskMap.set(task.task_id, {
      task_id: task.task_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      portfolio_id: task.portfolio_id,
      parent_task_id: task.parent_task_id,
      source_meeting_id: task.source_meeting_id,
      created_at: task.created_at,
      updated_at: task.updated_at,
      subtasks: [],
    });
  });

  // Second pass: build hierarchy
  tasks.forEach(task => {
    const hierarchicalTask = taskMap.get(task.task_id)!;
    
    if (task.parent_task_id) {
      const parentTask = taskMap.get(task.parent_task_id);
      if (parentTask) {
        parentTask.subtasks.push(hierarchicalTask);
      } else {
        // Parent not found, treat as root task
        rootTasks.push(hierarchicalTask);
      }
    } else {
      rootTasks.push(hierarchicalTask);
    }
  });

  return rootTasks;
}

export default function TaskConfirmationClient({
  meetingId,
  initialTasks,
  error,
  updateTaskAction,
  createTaskAction,
  deleteTaskAction,
  confirmAllTasksAction,
}: TaskConfirmationClientProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = React.useState(false);
  const [tasks, setTasks] = React.useState<TaskResponse[]>(initialTasks);
  const [alertMessage, setAlertMessage] = React.useState<{
    type: "success" | "danger" | "warning";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const hierarchicalTasks = React.useMemo(() => {
    return buildTaskHierarchy(tasks);
  }, [tasks]);

  const showAlert = (type: "success" | "danger" | "warning", message: string) => {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleTaskUpdate = async (taskId: number, updates: TaskUpdateRequest) => {
    startTransition(async () => {
      const result = await updateTaskAction(taskId, updates);
      if (result.success) {
        showAlert("success", "Task updated successfully");
        // Update local state
        setTasks(prev => prev.map(task => 
          task.task_id === taskId 
            ? { ...task, ...updates }
            : task
        ));
      } else {
        showAlert("danger", result.error || "Failed to update task");
      }
    });
  };

  const handleTaskCreate = async (taskData: TaskCreateRequest) => {
    startTransition(async () => {
      const result = await createTaskAction(taskData);
      if (result.success && result.task) {
        showAlert("success", "Task created successfully");
        // Add new task to local state
        setTasks(prev => [...prev, result.task!]);
      } else {
        showAlert("danger", result.error || "Failed to create task");
      }
    });
  };

  const handleTaskDelete = async (taskId: number) => {
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.success) {
        showAlert("success", "Task deleted successfully");
        // Remove task and its subtasks from local state
        setTasks(prev => {
          const taskToDelete = prev.find(t => t.task_id === taskId);
          if (!taskToDelete) return prev;
          
          // Remove the task and all its subtasks
          const tasksToRemove = new Set<number>();
          const addTaskAndSubtasks = (id: number) => {
            tasksToRemove.add(id);
            prev.filter(t => t.parent_task_id === id).forEach(subtask => {
              addTaskAndSubtasks(subtask.task_id);
            });
          };
          
          addTaskAndSubtasks(taskId);
          return prev.filter(task => !tasksToRemove.has(task.task_id));
        });
      } else {
        showAlert("danger", result.error || "Failed to delete task");
      }
    });
  };

  const handleConfirmAllTasks = async () => {
    if (tasks.length === 0) {
      showAlert("warning", "No tasks to confirm");
      return;
    }

    startTransition(async () => {
      const result = await confirmAllTasksAction(meetingId);
      if (result.success) {
        showAlert("success", `Successfully confirmed ${result.confirmedCount} tasks`);
        // Update all tasks status to "Not Started"
        setTasks(prev => prev.map(task => ({ ...task, status: "Not Started" })));
      } else {
        showAlert("danger", result.error || "Failed to confirm tasks");
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
        <h2>Meeting Task Confirmation</h2>
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
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" sx={{ mb: 1 }}>
              Meeting Task Confirmation
            </Typography>
            <Typography level="body-md" color="neutral">
              Review and confirm tasks from Meeting #{meetingId}
            </Typography>
          </Box>

          {/* Alert Messages */}
          {alertMessage && (
            <Alert
              color={alertMessage.type}
              sx={{ mb: 3 }}
              endDecorator={
                <Button
                  variant="plain"
                  size="sm"
                  onClick={() => setAlertMessage(null)}
                >
                  ✕
                </Button>
              }
            >
              {alertMessage.message}
            </Alert>
          )}

          {/* Task List */}
          <TaskConfirmationList
            tasks={hierarchicalTasks}
            meetingId={meetingId}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskDelete={handleTaskDelete}
            isLoading={isPending}
          />

          {/* Confirm All Button */}
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="solid"
                color="primary"
                size="lg"
                onClick={handleConfirmAllTasks}
                disabled={isPending || tasks.length === 0}
                startDecorator={isPending ? <CircularProgress size="sm" /> : null}
              >
                {isPending ? "Confirming..." : `Confirm All Tasks (${tasks.length})`}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </CssVarsProvider>
  );
} 