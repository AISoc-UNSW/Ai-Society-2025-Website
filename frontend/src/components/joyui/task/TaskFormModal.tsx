import { PortfolioSimple, TaskFormData, User } from "@/lib/types";
import { getCurrentDateTimeLocal, getEmailAvatarColor, getEmailInitials } from "@/lib/utils";
import {
    Button,
    Chip,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Textarea,
} from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import Stack from "@mui/joy/Stack";
import React from "react";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (formData: TaskFormData & { assignees: number[] }) => Promise<void>;
  initialData?: TaskFormData & { assignees?: number[] };
  title: string;
  portfolios: PortfolioSimple[];
  searchUsersAction?: (searchTerm: string) => Promise<User[]>;
}

export default function TaskFormModal({
  open,
  onClose,
  onSave,
  initialData,
  title,
  portfolios,
  searchUsersAction,
}: TaskFormModalProps) {
  const [formData, setFormData] = React.useState<TaskFormData>({
    title: "",
    description: "",
    priority: "Medium",
    deadline: getCurrentDateTimeLocal(), // Use current time as default
    portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : 101,
  });

  const [selectedAssignees, setSelectedAssignees] = React.useState<User[]>([]);
  const [userSearchResults, setUserSearchResults] = React.useState<User[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [assigneeSearchValue, setAssigneeSearchValue] = React.useState("");

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

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleUserSearch(assigneeSearchValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [assigneeSearchValue, handleUserSearch]);

  const handleAssigneeSelect = (user: User) => {
    if (!selectedAssignees.some(a => a.user_id === user.user_id)) {
      setSelectedAssignees(prev => [...prev, user]);
    }
    setAssigneeSearchValue("");
  };

  const handleAssigneeRemove = (userId: number) => {
    setSelectedAssignees(prev => prev.filter(a => a.user_id !== userId));
  };

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        deadline: getCurrentDateTimeLocal(),
        portfolio_id: portfolios.length > 0 ? portfolios[0].portfolio_id : 101,
      });
      setSelectedAssignees([]);
    }
  }, [initialData, open, portfolios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataWithAssignees = {
      ...formData,
      assignees: selectedAssignees.map(u => u.user_id),
    };
    await onSave(formDataWithAssignees);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 600 }}>
        {" "}
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

            {searchUsersAction && (
              <FormControl>
                <FormLabel>Assignees</FormLabel>
                <Input
                  value={assigneeSearchValue}
                  onChange={e => setAssigneeSearchValue(e.target.value)}
                  placeholder="Search users to assign"
                  endDecorator={searchLoading ? "Searching..." : null}
                />
                {userSearchResults.length > 0 && assigneeSearchValue && (
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 4,
                      marginTop: 4,
                      maxHeight: 150,
                      overflow: "auto",
                    }}
                  >
                    {userSearchResults.map(user => (
                      <Button
                        key={user.user_id}
                        variant="plain"
                        onClick={() => handleAssigneeSelect(user)}
                        sx={{ justifyContent: "flex-start", borderRadius: 0, px: 2, py: 1 }}
                      >
                        {user.username} ({user.email})
                      </Button>
                    ))}
                  </div>
                )}
                {selectedAssignees.length > 0 && (
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
                        key={assignee.user_id}
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
                              handleAssigneeRemove(assignee.user_id);
                            }}
                            sx={{
                              width: "24px",
                              height: "24px",
                              minWidth: "24px",
                              minHeight: "24px",
                              p: 0,
                              borderRadius: "50%",
                              cursor: "pointer",
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
                        {assignee.username}
                      </Chip>
                    ))}
                  </Stack>
                )}
              </FormControl>
            )}
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
