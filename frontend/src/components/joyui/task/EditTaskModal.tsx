"use client";

import * as React from "react";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import ModalClose from "@mui/joy/ModalClose";
import Typography from "@mui/joy/Typography";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import { Task, TaskStatus, PriorityLevel } from "@/lib/types";
import { formatDateWithMinutes } from "@/lib/utils";

interface EditTaskModalProps {
  open: boolean;
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"];
const priorityOptions: PriorityLevel[] = ["Low", "Medium", "High", "Critical"];

export default function EditTaskModal({
  open,
  task,
  onClose,
  onSave,
  isLoading = false,
}: EditTaskModalProps) {
  // Form state
  const [formData, setFormData] = React.useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: formatDateWithMinutes(task.deadline),
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when task changes
  React.useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: formatDateWithMinutes(task.deadline),
    });
    setErrors({});
  }, [task]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Task description is required";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate < new Date()) {
        newErrors.deadline = "Deadline cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        deadline: formData.deadline,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        size="md"
        sx={{
          maxWidth: "600px",
          width: "95%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <ModalClose />

        <Typography level="h4" sx={{ mb: 2 }}>
          Edit Task
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Task Title */}
            <FormControl error={!!errors.title}>
              <FormLabel>Task Title</FormLabel>
              <Input
                value={formData.title}
                onChange={e => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                disabled={isLoading}
              />
              {errors.title && (
                <Typography level="body-xs" color="danger">
                  {errors.title}
                </Typography>
              )}
            </FormControl>

            {/* Task Description */}
            <FormControl error={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={e => handleInputChange("description", e.target.value)}
                placeholder="Enter task description"
                minRows={3}
                maxRows={6}
                disabled={isLoading}
              />
              {errors.description && (
                <Typography level="body-xs" color="danger">
                  {errors.description}
                </Typography>
              )}
            </FormControl>

            {/* Status and Priority Row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(_, value) => value && handleInputChange("status", value)}
                  disabled={isLoading}
                >
                  {statusOptions.map(status => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(_, value) => value && handleInputChange("priority", value)}
                  disabled={isLoading}
                >
                  {priorityOptions.map(priority => (
                    <Option key={priority} value={priority}>
                      {priority}
                    </Option>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Deadline */}
            <FormControl error={!!errors.deadline}>
              <FormLabel>Deadline</FormLabel>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={e => handleInputChange("deadline", e.target.value)}
                disabled={isLoading}
              />
              {errors.deadline && (
                <Typography level="body-xs" color="danger">
                  {errors.deadline}
                </Typography>
              )}
            </FormControl>

            <Divider />

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button variant="outlined" color="neutral" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading} disabled={isLoading}>
                Save Changes
              </Button>
            </Stack>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}
