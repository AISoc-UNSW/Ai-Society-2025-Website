// Task related types
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Cancelled" | "Pending";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type Portfolio = "EDU" | "IT portfolio" | "Marketing";

export interface Person {
  id: string;
  name: string;
  avatar?: string;
}

export interface Assignee {
  id: number;
  name: string;
  avatar?: string;
  email: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  deadline: string;
  created_at: string;
  updated_at: string;
  source?: string;

  portfolio: Portfolio;
  assignees: Assignee[];
  subtasks: Task[];
}

// Meeting related types
export interface Meeting {
  id: string;
  title: string;
  department: string;
  summary: string;
  time: string;
  transcript: TranscriptLine[];
  relatedTaskIds: string[]; // IDs of tasks related to this meeting
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
}

// User related types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserRegistration {
  email: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTaskAssignment {
  assignment_id: number;
  task_id: number;
  task_title: string;
  task_status: string;
  task_priority: string;
  task_deadline: string;
}

// Task update interface to match backend TaskUpdate
export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  portfolio_id?: number;
  parent_task_id?: number;
  source_meeting_id?: number;
}
export interface TaskResponse {
  task_id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  portfolio_id: number;
  parent_task_id: number;
  source_meeting_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskUserAssignmentResponse {
  assignment_id: number;
  user_id: number;
  user_username: string;
  user_email: string;
}

export interface PortfolioDetailResponse {
  name: string;
  description: string;
  channel_id: string;
  portfolio_id: number;
  user_count: number;
  task_count: number;
  meeting_count: number;
  active_task_count: number;
}

// Task creation interface for confirmation page
export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: string;
  deadline: string;
  portfolio_id: number;
  parent_task_id?: number;
  source_meeting_id?: number;
}

// Hierarchical task structure for confirmation page
export interface HierarchicalTask {
  task_id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: string;
  portfolio_id: number;
  parent_task_id?: number;
  source_meeting_id?: number;
  created_at?: string;
  updated_at?: string;
  subtasks: HierarchicalTask[];
}

// Portfolio simple interface for dropdown lists
export interface PortfolioSimple {
  portfolio_id: number;
  name: string;
  description?: string;
  has_channel: boolean;
}
