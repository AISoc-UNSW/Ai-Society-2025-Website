import "server-only";
import { getAuthToken, removeAuthToken } from "../session";
import { createClient } from "../supabase/server";

// Basic API call function
// TODO: add error handling for 400, 401, 403, 404, 500
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiBase}${endpoint}`;

  // Try to get legacy session token first
  let token = await getAuthToken();

  // If no legacy token, try to get Supabase session token
  if (!token) {
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;

      console.log('API fetch auth check:', {
        endpoint,
        hasLegacyToken: !!(await getAuthToken()),
        hasSupabaseToken: !!token,
        supabaseUser: session?.user?.email || 'none'
      });
    } catch (error) {
      console.error('Failed to get Supabase session:', error);
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn('No authentication token available for API request:', endpoint);
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    cache: "no-store",
  });

  console.log('API response:', {
    url,
    status: response.status,
    hasAuthHeader: !!defaultHeaders["Authorization"]
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await removeAuthToken();
      throw new Error("Authentication failed. Please log in again.");
    } else if (response.status === 404) {
      throw new Error("Resource not found");
    }
    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
