import type {
    PortfolioListResponse,
    RoleListResponse,
    UserAdminUpdate,
    UserListResponse
} from '@/lib/types';
import { apiFetch } from './client';

/**
 * Get all users with pagination
 */
export async function getAllUsers(skip: number = 0, limit: number = 100): Promise<UserListResponse[]> {
  return await apiFetch(`/api/v1/users/?skip=${skip}&limit=${limit}`);
}

/**
 * Search users by query
 */
export async function searchUsers(query: string, limit: number = 10): Promise<UserListResponse[]> {
  return await apiFetch(`/api/v1/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Update user's role and portfolio (Admin only)
 */
export async function updateUserPermissions(userId: number, updates: UserAdminUpdate): Promise<UserListResponse> {
  return await apiFetch(`/api/v1/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Get all roles (simple list for dropdowns)
 */
export async function getAllRoles(): Promise<RoleListResponse[]> {
  return await apiFetch('/api/v1/roles/all/simple');
}

/**
 * Get all portfolios (simple list for dropdowns)
 */
export async function getAllPortfolios(): Promise<PortfolioListResponse[]> {
  return await apiFetch('/api/v1/portfolios/all/simple');
} 