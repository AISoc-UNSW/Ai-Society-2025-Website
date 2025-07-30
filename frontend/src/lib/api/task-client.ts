"use client";

import {
  Portfolio,
  PortfolioSimple,
  PriorityLevel,
  Task,
  TaskCreateRequest,
  TaskStatus,
  UserTaskAssignment,
} from "../types";
import { clientApiFetch } from "./client-side";
import { getPortfolioDetailsClient } from "./portfolio-client";

// Helper function to safely convert string to PriorityLevel
function safePriorityLevel(priority: string): PriorityLevel {
  const validPriorities: PriorityLevel[] = ["Low", "Medium", "High", "Critical"];
  return validPriorities.includes(priority as PriorityLevel)
    ? (priority as PriorityLevel)
    : "Medium";
}

// Helper function to safely convert string to Portfolio
function safePortfolio(portfolioName: string): Portfolio {
  const validPortfolios: Portfolio[] = ["EDU", "IT portfolio", "Marketing"];
  return validPortfolios.includes(portfolioName as Portfolio)
    ? (portfolioName as Portfolio)
    : "EDU";
}

// Client-side version of fetchUserTasks
export async function fetchUserTasksClient(): Promise<UserTaskAssignment[]> {
  return await clientApiFetch("/api/v1/task-assignments/user/me/tasks", {
    method: "GET",
  });
}

// Client-side version of getAllPortfoliosSimple
export async function getAllPortfoliosSimpleClient(): Promise<PortfolioSimple[]> {
  return await clientApiFetch("/api/v1/portfolios/all/simple", {
    method: "GET",
  });
}

// Client-side version of transformUserTaskToTask
export async function transformUserTaskToTaskClient(
  userTask: UserTaskAssignment
): Promise<Task> {
  try {
    const portfolio = await getPortfolioDetailsClient(userTask.task_portfolio_id);

    return {
      id: userTask.task_id,
      title: userTask.task_title,
      description: userTask.task_description,
      status: userTask.task_status as TaskStatus,
      priority: safePriorityLevel(userTask.task_priority),
      deadline: userTask.task_deadline || "",
      portfolio_id: userTask.task_portfolio_id,
      portfolio: safePortfolio(portfolio.name),
      assignees: [],
      created_by: {
        user_id: 0,
        username: "Unknown",
        email: "",
      },
      created_at: userTask.task_created_at || "",
      updated_at: userTask.task_updated_at || "",
      subtasks: [],
    };
  } catch (error) {
    console.error("Error transforming user task:", error);
    // Return a fallback task object
    return {
      id: userTask.task_id,
      title: userTask.task_title,
      description: userTask.task_description,
      status: userTask.task_status as TaskStatus,
      priority: safePriorityLevel(userTask.task_priority),
      deadline: userTask.task_deadline || "",
      portfolio_id: userTask.task_portfolio_id,
      portfolio: "EDU",
      assignees: [],
      created_by: {
        user_id: 0,
        username: "Unknown",
        email: "",
      },
      created_at: userTask.task_created_at || "",
      updated_at: userTask.task_updated_at || "",
      subtasks: [],
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