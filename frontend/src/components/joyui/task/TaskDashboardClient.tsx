"use client";

import Button from "@mui/joy/Button";
import AddIcon from "@mui/icons-material/Add";
import Tasks from "@/components/joyui/task/Tasks";
import TaskFormModal from "./TaskFormModal";
import {
  Task,
  TaskStatus,
  User,
  TaskFormData,
  TaskCreateRequest,
  PortfolioSimple,
} from "@/lib/types";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

interface TaskDashboardClientProps {
  tasks: Task[];
  error?: string;
  updateTaskStatusAction?: (
    taskId: number,
    status: TaskStatus
  ) => Promise<{ success: boolean; error?: string }>;
  updateTaskAction?: (
    taskId: number,
    updates: Partial<Task>
  ) => Promise<{ success: boolean; error?: string }>;
  searchUsersAction?: (searchTerm: string) => Promise<User[]>;
  updateTaskAssignmentAction?: (
    taskId: number,
    userIds: number[]
  ) => Promise<{ success: boolean; error?: string }>;
  createTaskAction?: (taskData: TaskCreateRequest) => Promise<{ success: boolean; error?: string }>;
  portfolios?: PortfolioSimple[];
  myTasks?: boolean;
  directorPortfolioId?: number;
  admin?: boolean;
  currentStatus?: string;
}

export default function TaskDashboardClient({
  tasks,
  error,
  updateTaskStatusAction,
  updateTaskAction,
  searchUsersAction,
  updateTaskAssignmentAction,
  createTaskAction,
  portfolios = [],
  myTasks = true,
  directorPortfolioId = undefined,
  admin = false,
  currentStatus = "all",
}: TaskDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStatusChange = (
    event: React.SyntheticEvent | null,
    newValue: string | number | null
  ) => {
    if (typeof newValue === "string") {
      router.push(`/taskbot/tasks/${newValue}`);
    }
  };

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

  const handleCreateTask = async (formData: TaskFormData) => {
    if (!createTaskAction) {
      alert("Task creation is not available");
      return;
    }

    startTransition(async () => {
      const result = await createTaskAction({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        deadline: formData.deadline,
        portfolio_id: formData.portfolio_id,
      });

      if (result.success) {
        setCreateTaskModalOpen(false);
      } else {
        alert(`Failed to create task: ${result.error}`);
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ padding: "16px" }}>
        <h2>My Tasks</h2>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      <Tasks
        myTasks={myTasks}
        directorPortfolioId={directorPortfolioId}
        admin={admin}
        tasks={tasks}
        onTaskStatusUpdate={handleTaskStatusUpdate}
        isUpdating={isPending}
        updateTaskAction={updateTaskAction}
        searchUsersAction={searchUsersAction}
        updateTaskAssignmentAction={updateTaskAssignmentAction}
        headerActions={
          <Button
            variant="solid"
            color="primary"
            startDecorator={<AddIcon />}
            onClick={() => setCreateTaskModalOpen(true)}
            disabled={isPending}
          >
            Create New Task
          </Button>
        }
        currentStatus={currentStatus}
        handleStatusChange={handleStatusChange}
      />

      {/* Create Task Modal */}
      <TaskFormModal
        open={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        onSave={handleCreateTask}
        portfolios={portfolios}
        title="Create New Task"
        searchUsersAction={searchUsersAction}
      />
    </>
  );
}
