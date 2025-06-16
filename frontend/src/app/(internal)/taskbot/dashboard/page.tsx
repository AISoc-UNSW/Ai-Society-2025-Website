import {
  fetchUserTasks,
  getTaskAssignees,
  getTaskDetails,
  updateTaskStatus,
  getSubtasks,
} from "@/lib/api/task";
import { PriorityLevel, Task, TaskStatus, UserTaskAssignment, Portfolio } from "@/lib/types";
import TaskDashboardClient from "@/components/joyui/task/TaskDashboardClient";
import { revalidatePath } from "next/cache";
import { getPortfolioDetails } from "@/lib/api/portfolio";

const transformUserTaskToTask = async (userTask: UserTaskAssignment): Promise<Task> => {
  const taskDetails = await getTaskDetails(userTask.task_id);

  // Get assignees for this task
  const assigneesData = await getTaskAssignees(userTask.task_id);
  const assignees = assigneesData.map(assignee => ({
    id: assignee.user_id,
    name: assignee.user_username,
    email: assignee.user_email,
  }));

  const portfolioDetails = await getPortfolioDetails(taskDetails.portfolio_id);

  // get subtasks for this task
  const subtasksData = await getSubtasks(userTask.task_id);
  const subtasks = subtasksData.map(subtask => ({
    id: subtask.task_id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status as TaskStatus,
    priority: subtask.priority as PriorityLevel,
    deadline: subtask.deadline,
    created_at: subtask.created_at,
    updated_at: subtask.updated_at,
    portfolio: portfolioDetails.name as Portfolio,
    assignees: [], // assignees for subtasks
    subtasks: [], // subtasks of subtasks
  }));

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
    subtasks: subtasks, // subtasks for this task
    assignees: assignees,
  };
};

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
    const apiTasks = await fetchUserTasks();
    const tasks = await Promise.all(apiTasks.map(transformUserTaskToTask));
    return <TaskDashboardClient tasks={tasks} updateTaskStatusAction={updateTaskStatusAction} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
    return <TaskDashboardClient tasks={[]} error={errorMessage} />;
  }
}
