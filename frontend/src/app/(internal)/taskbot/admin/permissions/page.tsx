import PermissionsClient from '@/components/joyui/permissions/PermissionsClient';
import { getAllPortfolios, getAllRoles, getAllUsers, searchUsers, updateUserPermissions } from '@/lib/api/permissions';
import { getCurrentUser } from '@/lib/api/user';
import type {
    PortfolioListResponse,
    RoleListResponse,
    UserAdminUpdate,
    UserListResponse
} from '@/lib/types';
import { redirect } from 'next/navigation';

// Server Actions
async function searchUsersAction(query: string): Promise<UserListResponse[]> {
  'use server';
  
  try {
    if (!query.trim()) {
      return await getAllUsers(0, 50);
    }
    return await searchUsers(query, 50);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

async function getAllUsersAction(): Promise<UserListResponse[]> {
  'use server';
  
  try {
    return await getAllUsers(0, 100);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

async function updateUserPermissionsAction(userId: number, updates: UserAdminUpdate): Promise<UserListResponse | null> {
  'use server';
  
  try {
    return await updateUserPermissions(userId, updates);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return null;
  }
}

async function getAllRolesAction(): Promise<RoleListResponse[]> {
  'use server';
  
  try {
    return await getAllRoles();
  } catch (error) {
    console.error('Error getting roles:', error);
    return [];
  }
}

async function getAllPortfoliosAction(): Promise<PortfolioListResponse[]> {
  'use server';
  
  try {
    return await getAllPortfolios();
  } catch (error) {
    console.error('Error getting portfolios:', error);
    return [];
  }
}

export default async function PermissionsPage() {
  const user = await getCurrentUser().catch(() => null);
  
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has admin role (assuming role_id 1 or 2 for director/admin)
  if (![1, 2].includes(user.role_id)) {
    redirect('/taskbot/dashboard');
  }

  // Load initial data
  const [initialUsers, roles, portfolios] = await Promise.all([
    getAllUsersAction(),
    getAllRolesAction(),
    getAllPortfoliosAction()
  ]);

  return (
    <PermissionsClient
      initialUsers={initialUsers}
      roles={roles}
      portfolios={portfolios}
      searchUsersAction={searchUsersAction}
      updateUserPermissionsAction={updateUserPermissionsAction}
    />
  );
} 