import { getPendingTasksByMeeting } from "@/lib/api/task";
import { updateTask, createTask, deleteTask } from "@/lib/api/task";
import { TaskResponse, TaskUpdateRequest, TaskCreateRequest } from "@/lib/types";
import TaskConfirmationClient from "@/components/joyui/task/TaskConfirmationClient";
import { revalidatePath } from "next/cache";

// Server Actions
async function updateTaskAction(taskId: number, updates: TaskUpdateRequest) {
  "use server";
  
  try {
    await updateTask(taskId, updates);
    revalidatePath(`/taskbot/meeting/[meeting_id]/confirm`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task",
    };
  }
}

async function createTaskAction(taskData: TaskCreateRequest) {
  "use server";
  
  try {
    const newTask = await createTask(taskData);
    revalidatePath(`/taskbot/meeting/[meeting_id]/confirm`);
    return { success: true, task: newTask };
  } catch (error) {
    console.error("Failed to create task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task",
    };
  }
}

async function deleteTaskAction(taskId: number) {
  "use server";
  
  try {
    await deleteTask(taskId);
    revalidatePath(`/taskbot/meeting/[meeting_id]/confirm`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete task",
    };
  }
}

async function confirmAllTasksAction(meetingId: number) {
  "use server";
  
  try {
    // Get all pending tasks for this meeting
    const pendingTasks = await getPendingTasksByMeeting(meetingId);
    
    // Update all tasks from "Pending" to "Not Started"
    const updatePromises = pendingTasks.map(task => 
      updateTask(task.task_id, { status: "Not Started" })
    );
    
    await Promise.all(updatePromises);
    revalidatePath(`/taskbot/meeting/[meeting_id]/confirm`);
    return { success: true, confirmedCount: pendingTasks.length };
  } catch (error) {
    console.error("Failed to confirm tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm tasks",
    };
  }
}

interface PageProps {
  params: Promise<{
    meeting_id: string;
  }>;
}

export default async function TaskConfirmationPage({ params }: PageProps) {
  const { meeting_id } = await params;
  const meetingId = parseInt(meeting_id);
  
  if (isNaN(meetingId)) {
    return (
      <div className="p-4">
        <h1>Invalid Meeting ID</h1>
        <p>The meeting ID provided is not valid.</p>
      </div>
    );
  }

  try {
    const pendingTasks = await getPendingTasksByMeeting(meetingId);
    
    return (
      <TaskConfirmationClient
        meetingId={meetingId}
        initialTasks={pendingTasks}
        updateTaskAction={updateTaskAction}
        createTaskAction={createTaskAction}
        deleteTaskAction={deleteTaskAction}
        confirmAllTasksAction={confirmAllTasksAction}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";
    return (
      <TaskConfirmationClient
        meetingId={meetingId}
        initialTasks={[]}
        error={errorMessage}
        updateTaskAction={updateTaskAction}
        createTaskAction={createTaskAction}
        deleteTaskAction={deleteTaskAction}
        confirmAllTasksAction={confirmAllTasksAction}
      />
    );
  }
} 