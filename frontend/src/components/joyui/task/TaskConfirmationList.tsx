"use client";

import {
  HierarchicalTask,
  Portfolio,
  PortfolioSimple,
  PriorityLevel,
  Task,
  TaskCreateRequest,
  TaskStatus,
  TaskUserAssignmentResponse,
  User
} from "@/lib/types";
import { formatDateWithMinutes, getEmailAvatarColor, getEmailInitials } from "@/lib/utils";
import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardActions from "@mui/joy/CardActions";
import CardContent from "@mui/joy/CardContent";
import Chip from "@mui/joy/Chip";
import DialogActions from "@mui/joy/DialogActions";
import DialogContent from "@mui/joy/DialogContent";
import DialogTitle from "@mui/joy/DialogTitle";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Stack from "@mui/joy/Stack";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import * as React from "react";
import EditTaskModal from "./EditTaskModal";

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "primary";
    case "Low":
      return "neutral";
    default:
      return "neutral";
  }
};

interface TaskConfirmationListProps {
  tasks: HierarchicalTask[];
  meetingId: number;
  portfolios: PortfolioSimple[];
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => Promise<void>;
  onTaskCreate: (taskData: TaskCreateRequest) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
  isLoading: boolean;
  searchUsersAction?: (searchTerm: string) => Promise<User[]>;
  updateTaskAssignmentAction?: (
    taskId: number,
    userIds: number[]
  ) => Promise<{ success: boolean; error?: string }>;
  getTaskAssigneesAction?: (taskId: number) => Promise<TaskUserAssignmentResponse[]>;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: PriorityLevel;
  deadline: string;
  portfolio_id: number;
}

export default function TaskConfirmationList({
  tasks,
  meetingId,
  portfolios,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  isLoading,
  searchUsersAction,
  updateTaskAssignmentAction,
  getTaskAssigneesAction,
}: TaskConfirmationListProps) {
  const [editingTask, setEditingTask] = React.useState<HierarchicalTask | null>(null);
  const [creatingTask, setCreatingTask] = React.useState<{
    parentId?: number;
    isOpen: boolean;
  }>({ isOpen: false });
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
  const [taskAssignees, setTaskAssignees] = React.useState<Map<number, TaskUserAssignmentResponse[]>>(new Map());

  // Helper function to get portfolio name by ID
  const getPortfolioName = (portfolioId: number): string => {
    const portfolio = portfolios.find(p => p.portfolio_id === portfolioId);
    return portfolio ? portfolio.name : `Portfolio ${portfolioId}`;
  };

  // Function to load assignees for a task
  const loadTaskAssignees = React.useCallback(async (taskId: number) => {
    if (getTaskAssigneesAction) {
      try {
        const assignees = await getTaskAssigneesAction(taskId);
        setTaskAssignees(prev => new Map(prev).set(taskId, assignees));
      } catch (error) {
        console.error("Failed to load task assignees:", error);
      }
    }
  }, [getTaskAssigneesAction]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Load assignees for all tasks when tasks change
  React.useEffect(() => {
    if (getTaskAssigneesAction) {
      tasks.forEach(task => {
        loadTaskAssignees(task.task_id);
        // Also load for subtasks
        const loadSubtaskAssignees = (subtasks: HierarchicalTask[]) => {
          subtasks.forEach(subtask => {
            loadTaskAssignees(subtask.task_id);
            if (subtask.subtasks.length > 0) {
              loadSubtaskAssignees(subtask.subtasks);
            }
          });
        };
        loadSubtaskAssignees(task.subtasks);
      });
    }
  }, [tasks, getTaskAssigneesAction, loadTaskAssignees]);

  const handleEditTask = async (task: HierarchicalTask) => {
    // Get current assignees for this task
    const currentAssignees = taskAssignees.get(task.task_id) || [];
    
    // Convert HierarchicalTask to Task for EditTaskModal
    const taskForEdit: Task = {
      id: task.task_id,
      title: task.title,
      description: task.description || "",
      status: task.status as TaskStatus,
      priority: task.priority as PriorityLevel,
      deadline: task.deadline,
      created_at: task.created_at || "",
      updated_at: task.updated_at || "",
      created_by: { user_id: 0, username: "", email: "" }, // Placeholder
      portfolio: getPortfolioName(task.portfolio_id) as Portfolio,
      assignees: currentAssignees.map(assignee => ({
        id: assignee.user_id,
        name: assignee.user_username,
        email: assignee.user_email,
      })),
      subtasks: [], // Not needed for editing
    };
    setTaskToEdit(taskForEdit);
  };

  const handleSaveEdit = async (updates: Partial<Task>) => {
    if (!taskToEdit) return;

    // Convert Task updates back to backend format
    const backendUpdates: any = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      deadline: updates.deadline,
    };

    // If portfolio was changed, find the portfolio_id
    if (updates.portfolio) {
      const portfolio = portfolios.find(p => p.name === updates.portfolio);
      if (portfolio) {
        backendUpdates.portfolio_id = portfolio.portfolio_id;
      }
    }

    await onTaskUpdate(taskToEdit.id, backendUpdates);
    // Reload assignees for the updated task
    await loadTaskAssignees(taskToEdit.id);
    setTaskToEdit(null);
  };

  const handleCreateTask = async (formData: TaskFormData, parentId?: number) => {
    await onTaskCreate({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      deadline: formData.deadline,
      portfolio_id: formData.portfolio_id,
      parent_task_id: parentId,
      source_meeting_id: meetingId,
    });
    setCreatingTask({ isOpen: false });
  };

  const handleDeleteTask = async (taskId: number) => {
    await onTaskDelete(taskId);
    setDeleteConfirm(null);
  };

  const renderTask = (task: HierarchicalTask, level: number = 0) => {
    const assignees = taskAssignees.get(task.task_id) || [];
    
    return (
      <Box key={task.task_id} sx={{ ml: level * 3 }}>
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            opacity: isLoading ? 0.7 : 1,
            borderLeft: level > 0 ? "3px solid" : "none",
            borderLeftColor: level > 0 ? "primary.300" : "transparent",
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              {/* Task Header */}
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography level="title-md" sx={{ fontWeight: "lg" }}>
                    {task.title}
                  </Typography>
                  {level > 0 && (
                    <Typography level="body-xs" color="neutral">
                      Subtask
                    </Typography>
                  )}
                </Box>
                <Chip size="sm" variant="soft" color={getPriorityColor(task.priority)}>
                  {task.priority}
                </Chip>
                <Chip size="sm" variant="soft" color="warning">
                  {task.status}
                </Chip>
              </Stack>

              {/* Task Description */}
              {task.description && (
                <Typography level="body-sm" color="neutral">
                  {task.description}
                </Typography>
              )}

              {/* Task Details */}
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography level="body-xs" color="neutral">
                  Due: {mounted ? formatDateWithMinutes(task.deadline, true) : "Loading..."}
                </Typography>
                <Typography level="body-xs" color="neutral">
                  Portfolio: {getPortfolioName(task.portfolio_id)}
                </Typography>
              </Stack>

              {/* Assignees Section */}
              {assignees.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography level="body-xs" color="neutral" sx={{ mr: 1 }}>
                    Assigned to:
                  </Typography>
                  <AvatarGroup size="sm" sx={{ "--AvatarGroup-gap": "-8px" }}>
                    {assignees.slice(0, 3).map((assignee) => (
                      <Avatar
                        key={assignee.user_id}
                        size="sm"
                        sx={{
                          backgroundColor: getEmailAvatarColor(assignee.user_email),
                          color: "white",
                          fontSize: "0.75rem",
                        }}
                        title={`${assignee.user_username} (${assignee.user_email})`}
                      >
                        {getEmailInitials(assignee.user_email)}
                      </Avatar>
                    ))}
                    {assignees.length > 3 && (
                      <Avatar size="sm" sx={{ fontSize: "0.75rem" }}>
                        +{assignees.length - 3}
                      </Avatar>
                    )}
                  </AvatarGroup>
                </Stack>
              )}
            </Stack>
          </CardContent>

          <CardActions>
            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => handleEditTask(task)}
                disabled={isLoading}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="sm"
                color="success"
                onClick={() => setCreatingTask({ parentId: task.task_id, isOpen: true })}
                disabled={isLoading}
              >
                Add Subtask
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                size="sm"
                color="danger"
                onClick={() => setDeleteConfirm(task.task_id)}
                disabled={isLoading}
              >
                Delete
              </Button>
            </Stack>
          </CardActions>
        </Card>

        {/* Render subtasks */}
        {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
      </Box>
    );
  };

  return (
    <>
      {/* Add Main Task Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="solid"
          color="primary"
          onClick={() => setCreatingTask({ isOpen: true })}
          disabled={isLoading}
        >
          Add Main Task
        </Button>
      </Box>

      {/* Task List */}
      {tasks.length > 0 ? (
        <Box>{tasks.map(task => renderTask(task))}</Box>
      ) : (
        <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <CardContent>
            <Typography level="h4" sx={{ mb: 2 }}>
              No Tasks Found
            </Typography>
            <Typography level="body-md" color="neutral">
              No pending tasks found for this meeting. Click &quot;Add Main Task&quot; to create a
              new task.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Edit Task Modal - Use EditTaskModal for assignment functionality */}
      {taskToEdit && (
        <EditTaskModal
          open={!!taskToEdit}
          task={taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onSave={handleSaveEdit}
          isLoading={isLoading}
          searchUsersAction={searchUsersAction}
          updateTaskAssignmentAction={updateTaskAssignmentAction}
          disableStatusChange={true}
        />
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        open={creatingTask.isOpen}
        onClose={() => setCreatingTask({ isOpen: false })}
        onSave={formData => handleCreateTask(formData, creatingTask.parentId)}
        portfolios={portfolios}
        title={creatingTask.parentId ? "Add Subtask" : "Add Main Task"}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this task? This action will also delete all subtasks and
            cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button
              variant="solid"
              color="danger"
              onClick={() => deleteConfirm && handleDeleteTask(deleteConfirm)}
            >
              Delete
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
}

// Task Form Modal Component
interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: TaskFormData) => Promise<void>;
  initialData?: TaskFormData;
  title: string;
  portfolios: PortfolioSimple[];
}

function TaskFormModal({
  open,
  onClose,
  onSave,
  initialData,
  title,
  portfolios,
}: TaskFormModalProps) {
  const [formData, setFormData] = React.useState<TaskFormData>({
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
    portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : 101, // Default to first portfolio
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        deadline: "",
        portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : 101,
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog>
        <ModalClose />
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ gap: 2 }}>
            <FormControl required>
              <FormLabel>Title</FormLabel>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                minRows={3}
              />
            </FormControl>

            <FormControl required>
              <FormLabel>Priority</FormLabel>
              <Select
                value={formData.priority}
                onChange={(_, value) =>
                  value && setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <Option value="Low">Low</Option>
                <Option value="Medium">Medium</Option>
                <Option value="High">High</Option>
                <Option value="Critical">Critical</Option>
              </Select>
            </FormControl>

            <FormControl required>
              <FormLabel>Deadline</FormLabel>
              <Input
                type="datetime-local"
                value={formData.deadline.slice(0, 16)} // Format for datetime-local input
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    deadline: e.target.value + ":00Z", // Add seconds and timezone
                  }))
                }
              />
            </FormControl>

            <FormControl required>
              <FormLabel>Portfolio</FormLabel>
              <Select
                value={formData.portfolio_id}
                onChange={(_, value) =>
                  value &&
                  setFormData(prev => ({
                    ...prev,
                    portfolio_id: value,
                  }))
                }
              >
                {portfolios.map(portfolio => (
                  <Option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                    {portfolio.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button type="submit" variant="solid" color="primary">
              Save
            </Button>
            <Button variant="plain" color="neutral" onClick={onClose}>
              Cancel
            </Button>
          </DialogActions>
        </form>
      </ModalDialog>
    </Modal>
  );
}
