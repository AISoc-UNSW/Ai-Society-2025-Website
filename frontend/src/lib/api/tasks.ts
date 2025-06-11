import { apiFetch } from './client';

// Get task list
export async function getTasks(params?: {
  portfolio_id?: number;
  status?: string;
  priority?: string;
  skip?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const query = searchParams.toString();
  const endpoint = query ? `/api/v1/tasks/?${query}` : '/api/v1/tasks/';
  
  return apiFetch(endpoint, {
    method: 'GET',
  });
}

// Create task
export async function createTask(data: {
  title: string;
  description?: string;
  deadline: string;
  portfolio_id: number;
  status?: string;
  priority?: string;
}) {
  return apiFetch('/api/v1/tasks/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get task details
export async function getTask(taskId: number) {
  return apiFetch(`/api/v1/tasks/${taskId}`, {
    method: 'GET',
  });
} 