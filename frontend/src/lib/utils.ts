import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RoleName, User } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Cookie utility functions
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

export const setCookie = (name: string, value: string, days?: number): void => {
  if (typeof document === "undefined") return;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

export const deleteCookie = (name: string): void => {
  if (typeof document === "undefined") return;

  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Get access token from cookie (common use case)
export const getAccessToken = (): string | null => {
  return getCookie("access-token");
};

/**
 * Generate avatar initials from email address
 * @param email - User's email address
 * @returns First letter of email in uppercase
 */
export function getEmailInitials(email: string): string {
  if (!email || typeof email !== "string") {
    return "?";
  }

  return email.charAt(0).toUpperCase();
}

/**
 * Generate a consistent background color based on email
 * @param email - User's email address
 * @returns CSS color value
 */
export function getEmailAvatarColor(email: string): string {
  if (!email) return "#9e9e9e";

  // Generate a hash from email to get consistent color
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to HSL color for better visual consistency
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export function getDirectorPortfolioId(roleName: RoleName, user: User): number | undefined {
  if (roleName === "director") {
    return user.portfolio_id;
  }
  return undefined;
}

export function isAdmin(roleName: RoleName): boolean {
  return roleName === "admin";
}

export function isUser(roleName: RoleName): boolean {
  return roleName === "user";
}

export function formatDateWithMinutes(dateString: string, forDisplay: boolean = false): string {
  try {
    const date = new Date(dateString);
    // Format to YYYY-MM-DDTHH:MM format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (forDisplay) {
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
}

// Helper function to get current datetime in 'yyyy-MM-ddTHH:mm' format
export function getCurrentDateTimeLocal() {
  const now = new Date();
  // Pad month, day, hour, minute with leading zeros if needed
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}
