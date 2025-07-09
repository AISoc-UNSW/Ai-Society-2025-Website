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

// Server-side API function that works in server components
export async function fetchUserTasks(): Promise<UserTaskAssignment[]> {
  return await apiFetch("/api/v1/task-assignments/user/me/tasks", {
    method: "GET",
  });
}

export async function getTasksByPortfolio(portfolioId: number): Promise<TaskResponse[]> {
  return await apiFetch(`/api/v1/tasks/portfolio/${portfolioId}`, {
    method: "GET",
  });
}

export async function fetchAllTasks(): Promise<TaskResponse[]> {
  return await apiFetch("/api/v1/tasks", {
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

// Keep the original function as fallback
export const transformUserTaskToTask = async (userTask: UserTaskAssignment): Promise<Task> => {
  const taskDetails = await getTaskDetails(userTask.task_id);

  // Get assignees for this task
  const assigneesData = await getTaskAssignees(userTask.task_id);
  const assignees = assigneesData.map(assignee => ({
    id: assignee.user_id,
    name: assignee.user_username,
    email: assignee.user_email,
  }));
  const creator = await getTaskCreator(userTask.task_id);

  const portfolioDetails = await getPortfolioDetails(taskDetails.portfolio_id);

  // Get subtasks for this task
  const subtasksData = await getSubtasks(userTask.task_id);
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
        portfolio: portfolioDetails.name as Portfolio,
        assignees: [], // assignees for subtasks
        subtasks: [], // subtasks of subtasks
      };
    })
  );

  return {
    id: userTask.task_id,
    title: userTask.task_title,
    portfolio: portfolioDetails.name as Portfolio,
    description: userTask.task_description,
    created_at: taskDetails.created_at,
    updated_at: taskDetails.updated_at,
    priority: userTask.task_priority as PriorityLevel,
    deadline: userTask.task_deadline,
    status: userTask.task_status as TaskStatus,
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
      const portfolioTasks = await getTasksByPortfolio(directorPortfolioId);
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
