"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import ModalClose from "@mui/joy/ModalClose";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import DialogActions from "@mui/joy/DialogActions";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import {
  HierarchicalTask,
  TaskUpdateRequest,
  TaskCreateRequest,
  PortfolioSimple,
} from "@/lib/types";
import { formatDateWithMinutes } from "@/lib/utils";

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
  onTaskUpdate: (taskId: number, updates: TaskUpdateRequest) => Promise<void>;
  onTaskCreate: (taskData: TaskCreateRequest) => Promise<void>;
  onTaskDelete: (taskId: number) => Promise<void>;
  isLoading: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
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
}: TaskConfirmationListProps) {
  const [editingTask, setEditingTask] = React.useState<HierarchicalTask | null>(null);
  const [creatingTask, setCreatingTask] = React.useState<{
    parentId?: number;
    isOpen: boolean;
  }>({ isOpen: false });
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Helper function to get portfolio name by ID
  const getPortfolioName = (portfolioId: number): string => {
    const portfolio = portfolios.find(p => p.portfolio_id === portfolioId);
    return portfolio ? portfolio.name : `Portfolio ${portfolioId}`;
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditTask = (task: HierarchicalTask) => {
    setEditingTask(task);
  };

  const handleSaveEdit = async (formData: TaskFormData) => {
    if (!editingTask) return;

    await onTaskUpdate(editingTask.task_id, {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      deadline: formData.deadline,
      portfolio_id: formData.portfolio_id,
    });
    setEditingTask(null);
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
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Typography level="body-xs" color="neutral">
                  Due: {mounted ? formatDateWithMinutes(task.deadline, true) : "Loading..."}
                </Typography>
                <Typography level="body-xs" color="neutral">
                  Portfolio: {getPortfolioName(task.portfolio_id)}
                </Typography>
              </Stack>
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

      {/* Edit Task Modal */}
      <TaskFormModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
        portfolios={portfolios}
        initialData={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority,
                deadline: editingTask.deadline,
                portfolio_id: editingTask.portfolio_id,
              }
            : undefined
        }
        title="Edit Task"
      />

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
