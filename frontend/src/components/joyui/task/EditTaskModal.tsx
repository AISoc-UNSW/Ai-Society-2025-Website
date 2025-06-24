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
import { Task, TaskStatus, PriorityLevel, User, Assignee } from "@/lib/types";
import { formatDateWithMinutes, getEmailAvatarColor, getEmailInitials } from "@/lib/utils";
import Avatar from "@mui/joy/Avatar";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";

interface EditTaskModalProps {
  open: boolean;
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
  searchUsersAction?: (searchTerm: string) => Promise<User[]>;
  updateTaskAssignmentAction?: (
    taskId: number,
    userIds: number[]
  ) => Promise<{ success: boolean; error?: string }>;
}

const statusOptions: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Cancelled"];
const priorityOptions: PriorityLevel[] = ["Low", "Medium", "High", "Critical"];

export default function EditTaskModal({
  open,
  task,
  onClose,
  onSave,
  isLoading = false,
  searchUsersAction,
  updateTaskAssignmentAction,
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

  // Assignees state
  const [selectedAssignees, setSelectedAssignees] = React.useState<Assignee[]>(
    task.assignees || []
  );
  const [userSearchResults, setUserSearchResults] = React.useState<User[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [assigneeSearchValue, setAssigneeSearchValue] = React.useState("");

  // Reset form when task changes
  React.useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: formatDateWithMinutes(task.deadline),
    });
    setSelectedAssignees(task.assignees || []);
    setErrors({});
  }, [task]);

  // Search users for assignee selection
  const handleUserSearch = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || !searchUsersAction) {
        setUserSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const users = await searchUsersAction(searchTerm);
        setUserSearchResults(users);
      } catch (error) {
        console.error("Failed to search users:", error);
        setUserSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchUsersAction]
  );

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleUserSearch(assigneeSearchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [assigneeSearchValue, handleUserSearch]);

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
      // Update task details
      await onSave({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        deadline: formData.deadline,
      });

      // Update task assignments if the action is available
      if (updateTaskAssignmentAction) {
        const assigneeIds = selectedAssignees.map(assignee => assignee.id);
        const result = await updateTaskAssignmentAction(task.id, assigneeIds);

        if (!result.success) {
          console.error("Failed to update assignees:", result.error);
          // You might want to show an error message to the user here
          return;
        }
      }

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

  // Handle assignee selection
  const handleAssigneeSelect = (user: User) => {
    const isAlreadySelected = selectedAssignees.some(assignee => assignee.id === user.user_id);
    if (!isAlreadySelected) {
      const newAssignee: Assignee = {
        id: user.user_id,
        name: user.username,
        email: user.email,
        avatar: user.avatar,
      };
      setSelectedAssignees(prev => [...prev, newAssignee]);
    }
    setAssigneeSearchValue("");
  };

  // Handle assignee removal
  const handleAssigneeRemove = (assigneeId: number) => {
    setSelectedAssignees(prev => prev.filter(assignee => assignee.id !== assigneeId));
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

            {/* Assignees Section - only show if searchUsersAction is available */}
            {searchUsersAction && (
              <FormControl>
                <FormLabel>Assignees</FormLabel>

                {/* Search input for adding assignees */}
                <Input
                  value={assigneeSearchValue}
                  onChange={e => setAssigneeSearchValue(e.target.value)}
                  placeholder="Search users to assign"
                  disabled={isLoading}
                  endDecorator={searchLoading ? "Searching..." : null}
                />

                {/* Search results dropdown */}
                {userSearchResults.length > 0 && assigneeSearchValue && (
                  <Stack
                    sx={{
                      mt: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "sm",
                      maxHeight: "150px",
                      overflow: "auto",
                    }}
                  >
                    {userSearchResults.map(user => (
                      <Button
                        key={user.user_id}
                        variant="plain"
                        onClick={() => handleAssigneeSelect(user)}
                        sx={{
                          justifyContent: "flex-start",
                          borderRadius: 0,
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Avatar
                          size="sm"
                          src={user.avatar}
                          sx={{
                            backgroundColor: !user.avatar
                              ? getEmailAvatarColor(user.email)
                              : undefined,
                            color: !user.avatar ? "white" : undefined,
                            mr: 1,
                          }}
                        >
                          {!user.avatar && getEmailInitials(user.email)}
                        </Avatar>
                        <Stack spacing={0}>
                          <Typography level="body-sm">{user.username}</Typography>
                          <Typography level="body-xs" color="neutral">
                            {user.email}
                          </Typography>
                        </Stack>
                      </Button>
                    ))}
                  </Stack>
                )}

                {/* Selected assignees */}
                {selectedAssignees.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      level="body-sm"
                      sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}
                    >
                      Selected ({selectedAssignees.length})
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        p: 1.5,
                        backgroundColor: "background.level1",
                        borderRadius: "sm",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {selectedAssignees.map(assignee => (
                        <Chip
                          key={assignee.id}
                          variant="soft"
                          color="primary"
                          size="md"
                          startDecorator={
                            <Avatar
                              size="sm"
                              src={assignee.avatar}
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: "0.75rem",
                                backgroundColor: !assignee.avatar
                                  ? getEmailAvatarColor(assignee.email)
                                  : undefined,
                                color: !assignee.avatar ? "white" : undefined,
                              }}
                            >
                              {!assignee.avatar && getEmailInitials(assignee.email)}
                            </Avatar>
                          }
                          endDecorator={
                            <Button
                              size="sm"
                              variant="plain"
                              color="neutral"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAssigneeRemove(assignee.id);
                              }}
                              disabled={isLoading}
                              sx={{
                                width: "24px",
                                height: "24px",
                                minWidth: "24px",
                                minHeight: "24px",
                                p: 0,
                                borderRadius: "50%",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                pointerEvents: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                lineHeight: 1,
                                "&:hover": {
                                  backgroundColor: "danger.softHoverBg",
                                  color: "danger.softColor",
                                },
                                "&:disabled": {
                                  cursor: "not-allowed",
                                  opacity: 0.5,
                                  pointerEvents: "auto",
                                },
                              }}
                            >
                              ✕
                            </Button>
                          }
                          sx={{
                            maxWidth: "200px",
                            "--Chip-paddingInline": "8px",
                            fontSize: "0.875rem",
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        >
                          {assignee.name}
                        </Chip>
                      ))}
                    </Stack>
                  </Box>
                )}
              </FormControl>
            )}

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
