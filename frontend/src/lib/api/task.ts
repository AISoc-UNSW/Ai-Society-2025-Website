import {
  TaskListResponse,
  TaskResponse,
  TaskUpdateRequest,
  TaskUserAssignmentResponse,
  UserTaskAssignment,
} from "../types";
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

export async function getSubtasks(taskId: number): Promise<TaskListResponse[]> {
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

// Get pending tasks for a specific meeting
export async function getPendingTasksByMeeting(meetingId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/meeting/${meetingId}/pending`, {
    method: "GET",
  });
}

// Create a new task
export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: string;
  deadline: string;
  portfolio_id: number;
  parent_task_id?: number;
  source_meeting_id?: number;
}): Promise<TaskResponse> {
  return await apiFetch("/api/v1/tasks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...taskData,
      status: "Pending", // Always set status to Pending for new tasks in confirmation page
    }),
  });
}

// Delete a task
export async function deleteTask(taskId: number): Promise<void> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
  });
}
