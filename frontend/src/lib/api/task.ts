import { TaskResponse, TaskUpdateRequest, TaskUserAssignmentResponse, UserTaskAssignment } from "../types";
import { apiFetch } from "./client";

// Server-side API function that works in server components
export async function fetchUserTasks(): Promise<UserTaskAssignment[]> {
  return await apiFetch("/api/v1/task-assignments/user/me/tasks", {
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
export async function updateTask(
  taskId: number,
  updates: TaskUpdateRequest
): Promise<TaskResponse> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}
