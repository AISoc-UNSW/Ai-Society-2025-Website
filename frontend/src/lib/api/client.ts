import "server-only";
import { getAuthToken, removeAuthToken } from "../session";

// Basic API call function
// TODO: add error handling for 400, 401, 403, 404, 500
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiBase}${endpoint}`;

  const token = await getAuthToken();

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await removeAuthToken();
      throw new Error("Authentication failed. Please log in again.");
    } else if (response.status === 404) {
      throw new Error("Resource not found");
    }
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}
