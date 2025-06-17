import { fetchUserTasks, updateTaskStatus, transformUserTaskToTask } from "@/lib/api/task";
import { TaskStatus } from "@/lib/types";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { revalidatePath } from "next/cache";

// Server Action for updating task status
async function updateTaskStatusAction(taskId: number, status: TaskStatus) {
  "use server";

  try {
    await updateTaskStatus(taskId, status);
    revalidatePath("/taskbot/dashboard"); // Refresh the page data
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    };
  }
}

// Server Component - handles data fetching
export default async function TaskDashboard() {
  try {
    const currentUserTasks = await fetchUserTasks();
    const tasks = await Promise.all(currentUserTasks.map(transformUserTaskToTask));
    return (
      <TaskDashboardClient
        tasks={tasks}
        updateTaskStatusAction={updateTaskStatusAction}
        myTasks={true}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
    return <TaskDashboardClient tasks={[]} error={errorMessage} myTasks={true} />;
  }
}
