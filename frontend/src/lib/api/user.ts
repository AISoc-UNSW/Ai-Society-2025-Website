import { LoginCredentials, LoginResponse, User, UserListResponse, UserProfileUpdate, UserRegistration } from "@/lib/types";
import { apiFetch } from "./client";

// Login
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", credentials.username);
  formData.append("password", credentials.password);

  return apiFetch("/api/v1/login/access-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
}

// Register User
export async function createUser(userData: UserRegistration): Promise<User> {
  return apiFetch("/api/v1/users/", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// Get Current User Information
export async function getCurrentUser(): Promise<User> {
  return apiFetch("/api/v1/users/me", {
    method: "GET",
  });
}

export async function searchUsers(searchTerm: string, limit: number = 100): Promise<User[]> {
  const params = new URLSearchParams({
    q: searchTerm,
    limit: limit.toString(),
  });

  return apiFetch(`/api/v1/users/search?${params.toString()}`, {
    method: "GET",
  });
}

// Update current user's profile
export async function updateUserProfile(updates: UserProfileUpdate): Promise<UserListResponse> {
  return apiFetch("/api/v1/users/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}
