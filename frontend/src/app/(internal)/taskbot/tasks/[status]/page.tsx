import { updateTaskStatus } from "@/lib/api/task";
import { TaskStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api/user";
import { Suspense } from "react";
import TaskLoadingState from "@/components/joyui/task/TaskLoadingState";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { getUserTasksWithRole } from "@/lib/api/task";

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

async function TaskData({ targetStatus }: { targetStatus: TaskStatus | null }) {
  try {
    const user = await getCurrentUser();
    const { tasks, userRole } = await getUserTasksWithRole(user, targetStatus);

    return (
      <TaskDashboardClient
        tasks={tasks}
        updateTaskStatusAction={updateTaskStatusAction}
        myTasks={userRole.showMyTasks}
        directorPortfolioId={userRole.directorPortfolioId}
        admin={userRole.userIsAdmin}
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
        myTasks={true}
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

  return (
    <div>
      <Suspense fallback={<TaskLoadingState stage="fetching" />}>
        <TaskData targetStatus={targetStatus} />
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
