"use client";

import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";
import {
  createTaskClient,
  fetchUserTasksClient,
  getAllPortfoliosSimpleClient,
  searchUsersClient,
  transformUserTaskToTaskClient,
  updateTaskAssignmentClient,
  updateTaskClient,
  updateTaskStatusClient,
} from "@/lib/api/task-client";
import { PortfolioSimple, Task, TaskCreateRequest, TaskStatus, User } from "@/lib/types";
import { useEffect, useState } from "react";

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch tasks and portfolios in parallel
        const [userTasks, portfoliosData] = await Promise.all([
          fetchUserTasksClient(),
          getAllPortfoliosSimpleClient(),
        ]);

        // Transform user tasks to tasks
        const transformedTasks = await Promise.all(
          userTasks.map(transformUserTaskToTaskClient)
        );

        setTasks(transformedTasks);
        setPortfolios(portfoliosData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Client-side action for updating task status
  const updateTaskStatusAction = async (taskId: number, status: TaskStatus) => {
    try {
      await updateTaskStatusClient(taskId, status);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.task_id === taskId ? { ...task, status } : task
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to update task status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update task",
      };
    }
  };

  // Client-side action for updating task
  const updateTaskAction = async (taskId: number, updates: Partial<Task>) => {
    try {
      await updateTaskClient(taskId, updates);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.task_id === taskId ? { ...task, ...updates } : task
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to update task:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update task",
      };
    }
  };

  // Client-side action for searching users
  const searchUsersAction = async (searchTerm: string): Promise<User[]> => {
    try {
      return await searchUsersClient(searchTerm, 10);
    } catch (error) {
      console.error("Failed to search users:", error);
      return [];
    }
  };

  // Client-side action for updating task assignment
  const updateTaskAssignmentAction = async (taskId: number, userIds: number[]) => {
    try {
      await updateTaskAssignmentClient(taskId, userIds);

      // Note: You might want to refresh the task data or update assignees locally
      // For now, we'll just return success

      return { success: true };
    } catch (error) {
      console.error("Failed to update task assignment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update assignees",
      };
    }
  };

  // Client-side action for creating task
  const createTaskAction = async (taskData: TaskCreateRequest) => {
    try {
      const newTask = await createTaskClient(taskData);

      if (taskData.assignees && taskData.assignees.length > 0) {
        await updateTaskAssignmentClient(newTask.task_id, taskData.assignees);
      }

      // Add the new task to local state
      setTasks(prevTasks => [...prevTasks, newTask]);

      return { success: true, task: newTask };
    } catch (error) {
      console.error("Failed to create task:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task",
      };
    }
  };

  // Show loading state
  if (loading) {
    return <TaskLoadingState stage="fetching" />;
  }

  // Render the dashboard
  return (
    <TaskDashboardClient
      tasks={tasks}
      portfolios={portfolios}
      error={error || undefined}
      updateTaskStatusAction={updateTaskStatusAction}
      updateTaskAction={updateTaskAction}
      createTaskAction={createTaskAction}
      searchUsersAction={searchUsersAction}
      updateTaskAssignmentAction={updateTaskAssignmentAction}
      myTasks={true}
    />
  );
}
