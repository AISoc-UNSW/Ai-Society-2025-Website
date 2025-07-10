import { cookies } from "next/headers";
import "server-only";
import { UserListResponse } from "./types";

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("session_token")?.value;
}

export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function removeAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}

export async function getCurrentUser(): Promise<UserListResponse | null> {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}
