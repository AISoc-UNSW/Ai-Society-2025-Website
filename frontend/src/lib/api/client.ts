import 'server-only';
import { getAuthToken, removeAuthToken } from '../session';

// Basic API call function
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiBase}${endpoint}`;
  
  // Get token
  const token = await getAuthToken();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add if there is a token
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    cache: 'no-store',
  });

  // Exception handling
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await removeAuthToken();
    } else if (response.status === 404) {
      throw new Error('Resource not found');
    }
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
} 