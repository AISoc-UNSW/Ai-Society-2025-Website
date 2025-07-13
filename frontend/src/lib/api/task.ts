import { getDirectorPortfolioId, isAdmin } from "@/lib/utils";
import {
  Portfolio,
  PriorityLevel,
  RoleName,
  Task,
  TaskCreatedByResponse,
  TaskResponse,
  TaskStatus,
  TaskUserAssignmentResponse,
  User,
  UserTaskAssignment,
} from "../types";
import { apiFetch } from "./client";
import { getPortfolioDetails } from "./portfolio";
import { getRole } from "./role";
import { Assignee } from "@/lib/types";

// Server-side API function that works in server components
export async function fetchUserTasks(): Promise<UserTaskAssignment[]> {
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
export async function updateTask(taskId: number, updates: Partial<Task>): Promise<TaskResponse> {
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

// Create a new task
export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: string;
  deadline: string;
  portfolio_id: number;
  parent_task_id?: number;
  source_meeting_id?: number;
  status?: string;
}): Promise<TaskResponse> {
  const { status, ...rest } = taskData;
  return await apiFetch("/api/v1/tasks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...rest,
      status: status ?? "Not Started",
    }),
  });
}

// Delete a task
export async function deleteTask(taskId: number): Promise<void> {
  return await apiFetch(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// Improved transformation that handles errors gracefully
export const transformUserTaskToTask = async (userTask: UserTaskAssignment): Promise<Task> => {
  // Essential data that we must have
  let portfolioDetails;
  try {
    portfolioDetails = await getPortfolioDetails(userTask.task_portfolio_id);
  } catch (error) {
    console.warn(`Failed to get portfolio details for task ${userTask.task_id}:`, error);
    portfolioDetails = { name: "Unknown Portfolio" };
  }

  // Optional data - handle failures gracefully
  let assignees: Assignee[] = [];
  try {
    const assigneesData = await getTaskAssignees(userTask.task_id);
    assignees = assigneesData.map(assignee => ({
      id: assignee.user_id,
      name: assignee.user_username,
      email: assignee.user_email,
    }));
  } catch (error) {
    console.warn(`Failed to get assignees for task ${userTask.task_id}:`, error);
    assignees = [];
  }

  let creator: TaskCreatedByResponse;
  try {
    creator = await getTaskCreator(userTask.task_id);
  } catch (error) {
    console.warn(`Failed to get creator for task ${userTask.task_id}:`, error);
    creator = {
      user_id: 0,
      username: "Unknown",
      email: "unknown@example.com",
    };
  }

  let subtasks: Task[] = [];
  try {
    const subtasksData = await getSubtasks(userTask.task_id);
    // For subtasks, we'll use a simpler approach to avoid recursive errors
    subtasks = await Promise.all(
      subtasksData.map(async subtask => {
        let subtaskCreator: TaskCreatedByResponse;
        try {
          subtaskCreator = await getTaskCreator(subtask.task_id);
        } catch {
          subtaskCreator = {
            user_id: 0,
            username: "Unknown",
            email: "unknown@example.com",
          };
        }

        return {
          id: subtask.task_id,
          title: subtask.title,
          description: subtask.description,
          status: subtask.status as TaskStatus,
          priority: subtask.priority as PriorityLevel,
          deadline: subtask.deadline,
          created_at: subtask.created_at,
          updated_at: subtask.updated_at,
          created_by: subtaskCreator,
          portfolio_id: subtask.portfolio_id,
          portfolio: portfolioDetails.name as Portfolio,
          assignees: [], // Skip assignees for subtasks to avoid more API calls
          subtasks: [], // No nested subtasks to avoid infinite recursion
        };
      })
    );
  } catch (error) {
    console.warn(`Failed to get subtasks for task ${userTask.task_id}:`, error);
    subtasks = [];
  }

  return {
    id: userTask.task_id,
    title: userTask.task_title,
    portfolio: portfolioDetails.name as Portfolio,
    description: userTask.task_description,
    created_at: userTask.task_created_at,
    updated_at: userTask.task_updated_at,
    priority: userTask.task_priority as PriorityLevel,
    deadline: userTask.task_deadline,
    status: userTask.task_status as TaskStatus,
    portfolio_id: userTask.task_portfolio_id,
    subtasks: subtasks,
    assignees: assignees,
    created_by: creator,
  };
};

export const transformTaskResponseToTask = async (taskResponse: TaskResponse): Promise<Task> => {
  const taskDetails = await getTaskDetails(taskResponse.task_id);
  const assigneesData = await getTaskAssignees(taskResponse.task_id);
  const assignees = assigneesData.map(assignee => ({
    id: assignee.user_id,
    name: assignee.user_username,
    email: assignee.user_email,
  }));
  const creator = await getTaskCreator(taskResponse.task_id);
  const portfolioDetails = await getPortfolioDetails(taskResponse.portfolio_id);
  const subtasksData = await getSubtasks(taskResponse.task_id);
  const subtasks = await Promise.all(
    subtasksData.map(async subtask => {
      const subtaskCreator = await getTaskCreator(subtask.task_id);
      return {
        id: subtask.task_id,
        title: subtask.title,
        description: subtask.description,
        status: subtask.status as TaskStatus,
        priority: subtask.priority as PriorityLevel,
        deadline: subtask.deadline,
        created_at: subtask.created_at,
        updated_at: subtask.updated_at,
        created_by: subtaskCreator,
        portfolio_id: subtask.portfolio_id,
        portfolio: portfolioDetails.name as Portfolio,
        assignees: [], // assignees for subtasks
        subtasks: [], // subtasks of subtasks
      };
    })
  );
  return {
    id: taskResponse.task_id,
    title: taskResponse.title,
    description: taskResponse.description,
    status: taskResponse.status as TaskStatus,
    priority: taskResponse.priority as PriorityLevel,
    deadline: taskResponse.deadline,
    created_at: taskDetails.created_at,
    updated_at: taskDetails.updated_at,
    created_by: creator,
    portfolio_id: taskResponse.portfolio_id,
    portfolio: portfolioDetails.name as Portfolio,
    assignees: assignees,
    subtasks: subtasks,
  };
};

export async function getUserTasksWithRole(user: User, targetStatus?: TaskStatus | null) {
  try {
    // Get user role
    const role = await getRole(user.role_id);
    const roleName = role.role_name as RoleName;
    const directorPortfolioId = getDirectorPortfolioId(roleName, user);
    const userIsAdmin = isAdmin(roleName);
    const showMyTasks = !directorPortfolioId && !userIsAdmin;

    // Load tasks based on role
    let allTasks: Task[] = [];
    if (directorPortfolioId) {
      const portfolioTasks = await fetchTasksByPortfolio(directorPortfolioId);
      allTasks = await Promise.all(portfolioTasks.map(transformTaskResponseToTask));
    } else if (userIsAdmin) {
      const adminTasks = await fetchAllTasks();
      allTasks = await Promise.all(adminTasks.map(transformTaskResponseToTask));
    } else {
      const userTasks = await fetchUserTasks();
      allTasks = await Promise.all(userTasks.map(transformUserTaskToTask));
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
