import {
  fetchUserTasks,
  transformUserTaskToTask,
  updateTaskStatus,
  updateTask,
  updateTaskAssignment,
} from "@/lib/api/task";
import { searchUsers } from "@/lib/api/user";
import { Task, TaskStatus, User } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";

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

// Add this server action
async function updateTaskAction(taskId: number, updates: Partial<Task>) {
  "use server";

  try {
    await updateTask(taskId, updates);
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

// Add these new server actions for assignees
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

// Data fetching component
async function TaskData() {
  try {
    const tasks = await fetchUserTasks();
    const transformedTasks = await Promise.all(tasks.map(transformUserTaskToTask));

    return (
      <TaskDashboardClient
        tasks={transformedTasks}
        updateTaskStatusAction={updateTaskStatusAction}
        updateTaskAction={updateTaskAction}
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
