// Task related types
export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Cancelled"
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical"
export type Department =
  | "Marketing"
  | "Finance"
  | "Human Resources"
  | "Engineering"
  | "Product"
  | "Sales"
  | "Customer Support"

export interface Person {
  id: string
  name: string
  avatar?: string
}

export interface SubTask {
  id: string
  title: string
  assignees: Person[]
  priority: PriorityLevel
  dueDate: string
  status: TaskStatus
  department: Department
  description: string
  source: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  department: Department
  assignees: Person[]
  description: string
  source: string
  createdAt: string
  updatedAt: string
  priority: PriorityLevel
  dueDate: string
  status: TaskStatus
  subtasks: SubTask[]
  meetingId?: string // Reference to the meeting this task is related to
}

// Meeting related types
export interface Meeting {
  id: string
  title: string
  department: string
  summary: string
  time: string
  transcript: TranscriptLine[]
  relatedTaskIds: string[] // IDs of tasks related to this meeting
}

export interface TranscriptLine {
  id: string
  speaker: string
  timestamp: string
  text: string
}
