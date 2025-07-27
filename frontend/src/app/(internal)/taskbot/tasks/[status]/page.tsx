import {
  createTask,
  updateTaskAssignment,
  updateTaskStatus,
  updateTask,
  fetchTasksCreatedByMe,
  getUserTasksWithRole,
  fetchUserTasks,
} from "@/lib/api/task";
import { TaskCreateRequest, TaskResponse, TaskStatus, User } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentUser, searchUsers } from "@/lib/api/user";
import { Suspense } from "react";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { getAllPortfoliosSimple } from "@/lib/api/portfolio";

// Valid status values - simplified to only include main views from sidebar
const VALID_STATUSES = ["my-tasks", "all", "created-tasks"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

interface PageProps {
  params: Promise<{
    status: string;
  }>;
}

// Server Action for updating task status
async function updateTaskStatusAction(taskId: number, status: TaskStatus) {
  "use server";

  try {
    await updateTaskStatus(taskId, status);
    revalidatePath(`/taskbot/tasks/[status]`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
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
    revalidatePath("/taskbot/tasks/[status]");
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
    revalidatePath(`/taskbot/tasks/[status]`);
    return { success: true, task: newTask };
  } catch (error) {
    console.error("Failed to create task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    };
  }
}

// Add the missing updateTaskAction server action
async function updateTaskAction(taskId: number, updates: Partial<TaskResponse>) {
  "use server";

  try {
    await updateTask(taskId, updates as Partial<TaskResponse>);
    revalidatePath(`/taskbot/tasks/[status]`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    };
  }
}

async function TaskData({ currentStatus }: { currentStatus: string }) {
  try {
    const user = await getCurrentUser();

    let tasks, userRole;

    if (currentStatus === "created-tasks") {
      // Fetch tasks created by current user
      tasks = await fetchTasksCreatedByMe(user.user_id);
      userRole = {
        showMyTasks: false,
        directorPortfolioId: undefined,
        userIsAdmin: false,
      };
    } else if (currentStatus === "my-tasks") {
      // Fetch user's assigned tasks using the specific API
      tasks = await fetchUserTasks();
      userRole = {
        showMyTasks: true,
        directorPortfolioId: undefined,
        userIsAdmin: false,
      };
    } else {
      // Fetch all tasks (role-based: admin sees all, director sees portfolio, user sees assigned)
      const result = await getUserTasksWithRole(user, null);
      tasks = result.tasks;
      userRole = result.userRole;
    }

    const portfolios = await getAllPortfoliosSimple();

    return (
      <TaskDashboardClient
        tasks={tasks}
        updateTaskStatusAction={updateTaskStatusAction}
        updateTaskAction={updateTaskAction}
        searchUsersAction={searchUsersAction}
        updateTaskAssignmentAction={updateTaskAssignmentAction}
        createTaskAction={createTaskAction}
        portfolios={portfolios}
        myTasks={userRole.showMyTasks}
        directorPortfolioId={userRole.directorPortfolioId}
        admin={userRole.userIsAdmin}
        currentStatus={currentStatus}
      />
    );
  } catch (error) {
    console.error("Failed to load tasks:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
    return (
      <TaskDashboardClient
        tasks={[]}
        error={errorMessage}
        updateTaskStatusAction={updateTaskStatusAction}
        updateTaskAction={updateTaskAction}
        searchUsersAction={searchUsersAction}
        updateTaskAssignmentAction={updateTaskAssignmentAction}
        createTaskAction={createTaskAction}
        portfolios={[]}
        myTasks={true}
        currentStatus={currentStatus}
      />
    );
  }
}

// Server Component - handles data fetching and filtering
export default async function TasksByStatusPage({ params }: PageProps) {
  const { status } = await params;

  // Validate status parameter
  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    notFound();
  }

  const validStatus = status as ValidStatus;

  return (
    <div>
      <Suspense fallback={<TaskLoadingState stage="fetching" />}>
        <TaskData currentStatus={validStatus} />
      </Suspense>
    </div>
  );
}

// Generate static params for known statuses (optional optimization)
export async function generateStaticParams() {
  return VALID_STATUSES.map(status => ({
    status: status,
  }));
}
