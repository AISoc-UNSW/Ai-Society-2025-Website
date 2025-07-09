'use client';

import Sidebar from '@/components/joyui/Sidebar';
import type {
    PortfolioListResponse,
    RoleListResponse,
    UserAdminUpdate,
    UserListResponse,
} from '@/lib/types';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    FormLabel,
    IconButton,
    Input,
    Option,
    Select,
    Sheet,
    Table,
    Typography,
} from '@mui/joy';
import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EditUserPermissionsModal from './EditUserPermissionsModal';

interface PermissionsClientProps {
  initialUsers: UserListResponse[];
  roles: RoleListResponse[];
  portfolios: PortfolioListResponse[];
  searchUsersAction: (query: string) => Promise<UserListResponse[]>;
  updateUserPermissionsAction: (userId: number, updates: UserAdminUpdate) => Promise<UserListResponse | null>;
}

export default function PermissionsClient({
  initialUsers,
  roles,
  portfolios,
  searchUsersAction,
  updateUserPermissionsAction,
}: PermissionsClientProps) {
  const [users, setUsers] = useState<UserListResponse[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [portfolioFilter, setPortfolioFilter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListResponse | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create lookup maps for roles and portfolios
  const rolesMap = useMemo(() => {
    const map = new Map<number, RoleListResponse>();
    roles.forEach(role => map.set(role.role_id, role));
    return map;
  }, [roles]);

  const portfoliosMap = useMemo(() => {
    const map = new Map<number, PortfolioListResponse>();
    portfolios.forEach(portfolio => map.set(portfolio.portfolio_id, portfolio));
    return map;
  }, [portfolios]);

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === null || user.role_id === roleFilter;
      const matchesPortfolio = portfolioFilter === null || user.portfolio_id === portfolioFilter;
      
      return matchesSearch && matchesRole && matchesPortfolio;
    });
  }, [users, searchQuery, roleFilter, portfolioFilter]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const searchResults = await searchUsersAction(query);
      setUsers(searchResults);
      setSearchQuery(query);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to search users' });
    } finally {
      setIsLoading(false);
    }
  }, [searchUsersAction]);

  // Handle user permission update
  const handleUpdatePermissions = useCallback(async (userId: number, updates: UserAdminUpdate) => {
    try {
      const updatedUser = await updateUserPermissionsAction(userId, updates);
      if (updatedUser) {
        setUsers(prev => prev.map(user => 
          user.user_id === userId ? updatedUser : user
        ));
        setAlert({ type: 'success', message: 'User permissions updated successfully' });
        setEditingUser(null);
      } else {
        setAlert({ type: 'error', message: 'Failed to update permissions' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Error occurred while updating permissions' });
    }
  }, [updateUserPermissionsAction]);

  // Get role name by ID
  const getRoleName = (roleId: number) => {
    return rolesMap.get(roleId)?.role_name || 'Unknown Role';
  };

  // Get portfolio name by ID
  const getPortfolioName = (portfolioId?: number) => {
    if (!portfolioId) return 'Unassigned';
    return portfoliosMap.get(portfolioId)?.name || 'Unknown Portfolio';
  };

  // Get role color
  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'director': return 'danger';
      case 'admin': return 'warning';
      case 'user': return 'primary';
      default: return 'neutral';
    }
  };

  // Prevent hydration mismatch by not rendering MUI components until mounted
  if (!mounted) {
    return (
      <div style={{ padding: '16px' }}>
        <h2>User Permissions Management</h2>
        <p>Loading permissions...</p>
      </div>
    );
  }

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.surface',
            minHeight: '100vh',
          }}
        >
          {/* Page Header */}
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" sx={{ mb: 1 }}>
              User Permissions Management
            </Typography>
            <Typography level="body-md" sx={{ color: 'neutral.600' }}>
              Manage user roles and portfolio assignments
            </Typography>
          </Box>

          {/* Alert */}
          {alert && (
            <Alert 
              color={alert.type === 'success' ? 'success' : 'danger'}
              sx={{ mb: 2 }}
              endDecorator={
                <IconButton
                  variant="soft"
                  size="sm"
                  color={alert.type === 'success' ? 'success' : 'danger'}
                  onClick={() => setAlert(null)}
                >
                  ×
                </IconButton>
              }
            >
              {alert.message}
            </Alert>
          )}

          {/* Search and Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'end' }}>
            <FormControl sx={{ minWidth: 300, flexGrow: 1 }}>
              <FormLabel>Search Users</FormLabel>
              <Input
                placeholder="Enter username or email to search..."
                startDecorator={<SearchIcon />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                endDecorator={
                  isLoading ? (
                    <CircularProgress size="sm" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSearch(searchQuery)}
                      disabled={isLoading}
                    >
                      Search
                    </Button>
                  )
                }
              />
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <FormLabel>Filter by Role</FormLabel>
              <Select
                placeholder="All Roles"
                value={roleFilter}
                onChange={(_, value) => setRoleFilter(value)}
              >
                <Option value={null}>All Roles</Option>
                {roles.map(role => (
                  <Option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <FormLabel>Filter by Portfolio</FormLabel>
              <Select
                placeholder="All Portfolios"
                value={portfolioFilter}
                onChange={(_, value) => setPortfolioFilter(value)}
              >
                <Option value={null}>All Portfolios</Option>
                {portfolios.map(portfolio => (
                  <Option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                    {portfolio.name}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Users Table */}
          <Sheet variant="outlined" sx={{ borderRadius: 8 }}>
            <Table hoverRow>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '200px' }}>Username</th>
                  <th style={{ width: '250px' }}>Email</th>
                  <th style={{ width: '120px' }}>Role</th>
                  <th style={{ width: '150px' }}>Portfolio</th>
                  <th style={{ width: '150px' }}>Discord ID</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                      <Typography level="body-md" sx={{ color: 'neutral.500' }}>
                        {isLoading ? 'Loading...' : 'No users found'}
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.user_id}>
                      <td>
                        <PersonIcon color="primary" />
                      </td>
                      <td>
                        <Typography level="body-sm" fontWeight="md">
                          {user.username}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm">
                          {user.email}
                        </Typography>
                      </td>
                      <td>
                        <Chip
                          color={getRoleColor(getRoleName(user.role_id))}
                          size="sm"
                          variant="soft"
                        >
                          {getRoleName(user.role_id)}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-sm">
                          {getPortfolioName(user.portfolio_id)}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm" sx={{ fontFamily: 'monospace', fontSize: 'xs' }}>
                          {user.discord_id || '-'}
                        </Typography>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <IconButton
                          size="sm"
                          variant="soft"
                          color="primary"
                          onClick={() => setEditingUser(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Sheet>

          {/* Stats */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography level="body-sm" sx={{ color: 'neutral.600' }}>
              Showing {filteredUsers.length} users out of {users.length} total
            </Typography>
          </Box>

          {/* Edit User Modal */}
          {editingUser && (
            <EditUserPermissionsModal
              user={editingUser}
              roles={roles}
              portfolios={portfolios}
              onSave={handleUpdatePermissions}
              onClose={() => setEditingUser(null)}
            />
          )}
        </Box>
      </Box>
    </CssVarsProvider>
  );
} 