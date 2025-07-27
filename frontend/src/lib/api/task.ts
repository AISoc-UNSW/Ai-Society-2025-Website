import { getDirectorPortfolioId, isAdmin } from "@/lib/utils";
import {
  RoleName,
  TaskCreatedByResponse,
  TaskResponse,
  TaskStatus,
  TaskUserAssignmentResponse,
  User,
} from "../types";
import { apiFetch } from "./client";
import { getRole } from "./role";

// Server-side API function that works in server components
export async function fetchUserTasks(): Promise<TaskResponse[]> {
  return await apiFetch("/api/v1/task-assignments/user/me/tasks", {
    method: "GET",
  });
}

export async function fetchTasksByPortfolio(portfolioId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/portfolio/${portfolioId}`, {
    method: "GET",
  });
}

export async function fetchAllTasks(): Promise<TaskResponse[]> {
  return await apiFetch("/api/v1/tasks", {
    method: "GET",
  });
}

export async function fetchTasksCreatedByMe(userId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/created-by/${userId}`, {
    method: "GET",
  });
}

export async function getTaskDetails(taskId: number): Promise<TaskResponse> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "GET",
  });
}

export async function getTaskAssignees(taskId: number): Promise<TaskUserAssignmentResponse[]> {
  return await apiFetch(`/api/v1/task-assignments/task/${taskId}/users`, {
    method: "GET",
  });
}

export async function getTaskCreator(taskId: number): Promise<TaskCreatedByResponse> {
  return await apiFetch(`/api/v1/tasks/${taskId}/created-by`, {
    method: "GET",
  });
}

export async function getSubtasks(taskId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/subtasks/${taskId}`, {
    method: "GET",
  });
}

// Update task status function
export async function updateTaskStatus(taskId: number, status: string): Promise<TaskResponse> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

// General task update function
export async function updateTask(taskId: number, updates: Partial<TaskResponse>): Promise<TaskResponse> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}

export async function updateTaskAssignment(taskId: number, userIds: number[]) {
  return await apiFetch(`/api/v1/task-assignments/task/${taskId}/users`, {
    method: "PUT",
    body: JSON.stringify({ user_ids: userIds }),
  });
}

// Get pending tasks for a specific meeting
export async function getPendingTasksByMeeting(meetingId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/meeting/${meetingId}/pending`, {
    method: "GET",
  });
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: string;
  deadline: string;
  portfolio_id: number;
}): Promise<TaskResponse> {
  return await apiFetch("/api/v1/tasks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(taskId: number): Promise<void> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function getUserTasksWithRole(user: User, targetStatus?: TaskStatus | null) {
  try {
    const role = await getRole(user.role_id);
    const roleName = role.role_name as RoleName;
    const directorPortfolioId = getDirectorPortfolioId(roleName, user);
    const userIsAdmin = isAdmin(roleName);
    const showMyTasks = !directorPortfolioId && !userIsAdmin;

    // Load tasks based on role
    let allTasks: TaskResponse[] = [];
    if (directorPortfolioId) {
      allTasks = await fetchTasksByPortfolio(directorPortfolioId);
    } else if (userIsAdmin) {
      allTasks = await fetchAllTasks();
    } else {
      allTasks = await fetchUserTasks();
    }

    // Filter by status if specified
    const filteredTasks = targetStatus
      ? allTasks.filter(task => task.status === targetStatus)
      : allTasks;

    return {
      tasks: filteredTasks,
      userRole: {
        showMyTasks,
        directorPortfolioId,
        userIsAdmin,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to load tasks");
  }
}
