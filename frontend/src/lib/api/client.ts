import "server-only";
import { getAuthToken, removeAuthToken } from "../session";

// Define API error types
export class APIError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

// Improved API call function
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
    let errorMessage = "An error occurred";
    let errorDetails: unknown;

    try {
      errorDetails = await response.json();

      switch (response.status) {
        case 400:
          if (endpoint.includes("/login/access-token")) {
            errorMessage = "Invalid username or password. Please check your credentials and try again.";
          } else if (endpoint.includes("/users/")) {
            errorMessage = (errorDetails as { detail?: string })?.detail || "Invalid user data. Please check your input.";
          } else if ((errorDetails as { detail?: string })?.detail) {
            errorMessage = (errorDetails as { detail: string }).detail;
          } else {
            errorMessage = "Bad request. Please check your input and try again.";
          }
          break;
        case 401:
          await removeAuthToken();
          errorMessage = "Your session has expired. Please log in again.";
          break;
        case 403:
          errorMessage = "You don't have permission to perform this action.";
          break;
        case 404:
          errorMessage = "The requested resource was not found.";
          break;
        case 422:
          if ((errorDetails as { detail?: unknown })?.detail) {
            // Handle validation errors
            const detail = (errorDetails as { detail: unknown }).detail;
            if (Array.isArray(detail)) {
              const validationErrors = detail.map((err: { loc?: string[]; msg: string }) =>
                `${err.loc?.join(' ')}: ${err.msg}`
              ).join(', ');
              errorMessage = `Validation error: ${validationErrors}`;
            } else {
              errorMessage = String(detail);
            }
          } else {
            errorMessage = "Invalid data format. Please check your input.";
          }
          break;
        case 429:
          errorMessage = "Too many requests. Please try again later.";
          break;
        case 500:
          errorMessage = "Internal server error. Please try again later.";
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = "Service temporarily unavailable. Please try again later.";
          break;
        default:
          errorMessage = (errorDetails as { detail?: string })?.detail || `Request failed with status ${response.status}`;
      }
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }

    throw new APIError(errorMessage, response.status, errorDetails);
  }

  return response.json();
}
