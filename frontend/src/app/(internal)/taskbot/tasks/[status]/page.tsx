import {
  fetchAllTasks,
  fetchUserTasks,
  getTasksByPortfolio,
  transformTaskResponseToTask,
  transformUserTaskToTask,
  updateTaskStatus,
} from "@/lib/api/task";
import { Task, TaskStatus, RoleName } from "@/lib/types";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api/user";
import { getRole } from "@/lib/api/role";
import { getDirectorPortfolioId, isAdmin } from "@/lib/utils";

import { Suspense } from "react";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";

// Valid status values from sidebar configuration
const VALID_STATUSES = ["all", "in-progress", "completed", "cancelled"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

// Map URL status to TaskStatus
const STATUS_MAPPING: Record<ValidStatus, TaskStatus | null> = {
  all: null, // null means show all tasks
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

// Filter tasks by status
function filterTasksByStatus(tasks: Task[], targetStatus: TaskStatus | null): Task[] {
  if (targetStatus === null) {
    return tasks;
  }
  return tasks.filter(task => task.status === targetStatus);
}

async function TaskData({
  targetStatus,
  showMyTasks,
  directorPortfolioId,
  userIsAdmin,
}: {
  targetStatus: TaskStatus | null;
  showMyTasks: boolean;
  directorPortfolioId: number | undefined;
  userIsAdmin: boolean;
}) {
  try {
    let tasks: Task[] = [];
    if (directorPortfolioId) {
      console.log("directorPortfolioId", directorPortfolioId);
      const portfolioTasks = await getTasksByPortfolio(directorPortfolioId);
      tasks = await Promise.all(portfolioTasks.map(transformTaskResponseToTask));
    } else if (userIsAdmin) {
      console.log("userIsAdmin", userIsAdmin);
      const allTasks = await fetchAllTasks();
      tasks = await Promise.all(allTasks.map(transformTaskResponseToTask));
    } else if (showMyTasks) {
      console.log("showMyTasks", showMyTasks);
      const currentUserTasks = await fetchUserTasks();
      tasks = await Promise.all(currentUserTasks.map(transformUserTaskToTask));
    }

    // Filter tasks based on status
    const filteredTasks = filterTasksByStatus(tasks, targetStatus);

    return (
      <TaskDashboardClient
        tasks={filteredTasks}
        updateTaskStatusAction={updateTaskStatusAction}
        myTasks={showMyTasks}
        directorPortfolioId={directorPortfolioId}
        admin={userIsAdmin}
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
        myTasks={showMyTasks}
        directorPortfolioId={directorPortfolioId}
        admin={userIsAdmin}
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
  const targetStatus = STATUS_MAPPING[validStatus];

  const user = await getCurrentUser();
  const role = await getRole(user.role_id);
  const roleName = role.role_name as RoleName;
  const directorPortfolioId = getDirectorPortfolioId(roleName, user);
  console.log("directorPortfolioId", directorPortfolioId);
  const userIsAdmin = isAdmin(roleName);

  // Only show "my tasks" when user is neither director nor admin
  const showMyTasks = !directorPortfolioId && !userIsAdmin;

  return (
    <div>
      <Suspense fallback={<TaskLoadingState stage="fetching" />}>
        <TaskData
          targetStatus={targetStatus}
          showMyTasks={showMyTasks}
          directorPortfolioId={directorPortfolioId}
          userIsAdmin={userIsAdmin}
        />
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
