import { UserTaskAssignment } from "../types";

// API configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
  endpoints: {
    userTasks: "/api/v1/task-assignments/user/me/tasks",
  },
};

export class TaskApiService {
  private getAuthHeaders(accessToken?: string): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }

  async getUserTasks(accessToken: string): Promise<UserTaskAssignment[]> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userTasks}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(accessToken),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }

        throw new Error(
          `Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to the API server.");
      }
      throw error;
    }
  }
}

export const taskApi = new TaskApiService();
