import {
  fetchUserTasks,
  updateTaskStatus,
  updateTask,
  updateTaskAssignment,
  createTask,
} from "@/lib/api/task";
import { searchUsers } from "@/lib/api/user";
import { TaskCreateRequest, TaskResponse, TaskStatus, User } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { getAllPortfoliosSimple } from "@/lib/api/portfolio";

// Server Action for updating task status
async function updateTaskStatusAction(taskId: number, status: TaskStatus) {
  "use server";

  try {
    await updateTaskStatus(taskId, status);
    revalidatePath("/taskbot/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    };
  }
}

async function updateTaskAction(taskId: number, updates: Partial<TaskResponse>) {
  "use server";

  try {
    await updateTask(taskId, updates as Partial<TaskResponse>);
    revalidatePath("/taskbot/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    };
  }
}

// server actions for assignees
async function searchUsersAction(searchTerm: string): Promise<User[]> {
  "use server";

  try {
    return await searchUsers(searchTerm, 10);
  } catch (error) {
    console.error("Failed to search users:", error);
    return [];
  }
}

async function updateTaskAssignmentAction(taskId: number, userIds: number[]) {
  "use server";

  try {
    await updateTaskAssignment(taskId, userIds);
    revalidatePath("/taskbot/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update assignees",
    };
  }
}

async function createTaskAction(taskData: TaskCreateRequest) {
    "use server";
    
    try {
      const newTask = await createTask(taskData);
      await updateTaskAssignment(newTask.task_id, taskData.assignees || []);
      revalidatePath(`/taskbot/dashboard`);
      return { success: true, task: newTask };
    } catch (error) {
      console.error("Failed to create task:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task",
      };
    }
  }

// Data fetching component
async function TaskData() {
  try {
    const tasks = await fetchUserTasks();
    const portfolios = await getAllPortfoliosSimple();

    return (
      <TaskDashboardClient
        tasks={tasks as TaskResponse[]}
        updateTaskStatusAction={updateTaskStatusAction}
        updateTaskAction={updateTaskAction}
        createTaskAction={createTaskAction}
        portfolios={portfolios}
        searchUsersAction={searchUsersAction}
        updateTaskAssignmentAction={updateTaskAssignmentAction}
        myTasks={true}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
    return (
      <TaskDashboardClient
        tasks={[]}
        error={errorMessage}
        updateTaskStatusAction={updateTaskStatusAction}
        updateTaskAction={updateTaskAction}
        createTaskAction={createTaskAction}
        searchUsersAction={searchUsersAction}
        updateTaskAssignmentAction={updateTaskAssignmentAction}
        myTasks={true}
      />
    );
  }
}

// Server Component - handles data fetching
export default async function TaskDashboard() {
  return (
    <div>
      <Suspense fallback={<TaskLoadingState stage="fetching" />}>
        <TaskData />
      </Suspense>
    </div>
  );
}
