"use client";

import {
  Portfolio,
  Task,
  TaskCreateRequest,
  TaskStatus,
  UserTaskAssignment,
} from "../types";
import { clientApiFetch } from "./client-side";
import { getPortfolioDetailsClient } from "./portfolio-client";
import { getRoleClient } from "./role-client";

// Client-side version of fetchUserTasks
export async function fetchUserTasksClient(): Promise<UserTaskAssignment[]> {
  return await clientApiFetch("/api/v1/task-assignments/user/me/tasks", {
    method: "GET",
  });
}

// Client-side version of getAllPortfoliosSimple
export async function getAllPortfoliosSimpleClient(): Promise<Portfolio[]> {
  return await clientApiFetch("/api/v1/portfolios/all/simple", {
    method: "GET",
  });
}

// Client-side version of transformUserTaskToTask
export async function transformUserTaskToTaskClient(
  userTask: UserTaskAssignment
): Promise<Task> {
  try {
    const [role, portfolio] = await Promise.all([
      getRoleClient(userTask.task.created_by_role_id),
      getPortfolioDetailsClient(userTask.task.portfolio_id),
    ]);

    return {
      task_id: userTask.task.task_id,
      title: userTask.task.title,
      description: userTask.task.description,
      status: userTask.task.status as TaskStatus,
      priority: userTask.task.priority,
      deadline: userTask.task.deadline ? new Date(userTask.task.deadline) : undefined,
      portfolio: portfolio.name,
      assignees: [
        {
          id: userTask.user.user_id,
          name: userTask.user.username,
          email: userTask.user.email,
          avatar: null,
        },
      ],
      createdBy: {
        name: role?.name || "Unknown",
        role: role?.name || "Unknown",
      },
      created_at: new Date(userTask.task.created_at),
      updated_at: new Date(userTask.task.updated_at),
      subtasks: [],
      parent_task_id: userTask.task.parent_task_id,
      source_meeting_id: userTask.task.source_meeting_id,
    };
  } catch (error) {
    console.error("Error transforming user task:", error);
    // Return a fallback task object
    return {
      task_id: userTask.task.task_id,
      title: userTask.task.title,
      description: userTask.task.description,
      status: userTask.task.status as TaskStatus,
      priority: userTask.task.priority,
      deadline: userTask.task.deadline ? new Date(userTask.task.deadline) : undefined,
      portfolio: "Unknown",
      assignees: [
        {
          id: userTask.user.user_id,
          name: userTask.user.username,
          email: userTask.user.email,
          avatar: null,
        },
      ],
      createdBy: {
        name: "Unknown",
        role: "Unknown",
      },
      created_at: new Date(userTask.task.created_at),
      updated_at: new Date(userTask.task.updated_at),
      subtasks: [],
      parent_task_id: userTask.task.parent_task_id,
      source_meeting_id: userTask.task.source_meeting_id,
    };
  }
}

// Client-side versions of task operations
export async function updateTaskStatusClient(taskId: number, status: TaskStatus): Promise<void> {
  await clientApiFetch(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function updateTaskClient(taskId: number, updates: Partial<Task>): Promise<void> {
  await clientApiFetch(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function createTaskClient(taskData: TaskCreateRequest): Promise<Task> {
  return await clientApiFetch("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}

export async function updateTaskAssignmentClient(taskId: number, userIds: number[]): Promise<void> {
  await clientApiFetch(`/api/v1/task-assignments/task/${taskId}`, {
    method: "PUT",
    body: JSON.stringify({ user_ids: userIds }),
  });
}

export async function searchUsersClient(searchTerm: string, limit: number = 10) {
  return await clientApiFetch(`/api/v1/users/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
    method: "GET",
  });
} 