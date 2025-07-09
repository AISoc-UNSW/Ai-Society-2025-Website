'use client';

import type {
    PortfolioListResponse,
    RoleListResponse,
    UserAdminUpdate,
    UserListResponse,
} from '@/lib/types';
import PersonIcon from '@mui/icons-material/Person';
import {
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    FormLabel,
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Stack,
    Typography,
} from '@mui/joy';
import { useState } from 'react';

interface EditUserPermissionsModalProps {
  user: UserListResponse;
  roles: RoleListResponse[];
  portfolios: PortfolioListResponse[];
  onSave: (userId: number, updates: UserAdminUpdate) => Promise<void>;
  onClose: () => void;
}

export default function EditUserPermissionsModal({
  user,
  roles,
  portfolios,
  onSave,
  onClose,
}: EditUserPermissionsModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number>(user.role_id);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(user.portfolio_id || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updates: UserAdminUpdate = {};
      
      if (selectedRoleId !== user.role_id) {
        updates.role_id = selectedRoleId;
      }
      
      if (selectedPortfolioId !== user.portfolio_id) {
        updates.portfolio_id = selectedPortfolioId || undefined;
      }

      // Only call API if there are actual changes
      if (Object.keys(updates).length > 0) {
        await onSave(user.user_id, updates);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving user permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRoleName = () => {
    return roles.find(role => role.role_id === user.role_id)?.role_name || 'Unknown';
  };

  const getCurrentPortfolioName = () => {
    if (!user.portfolio_id) return 'Unassigned';
    return portfolios.find(p => p.portfolio_id === user.portfolio_id)?.name || 'Unknown';
  };

  const getSelectedRoleName = () => {
    return roles.find(role => role.role_id === selectedRoleId)?.role_name || 'Unknown';
  };

  const getSelectedPortfolioName = () => {
    if (!selectedPortfolioId) return 'Unassigned';
    return portfolios.find(p => p.portfolio_id === selectedPortfolioId)?.name || 'Unknown';
  };

  const hasChanges = selectedRoleId !== user.role_id || selectedPortfolioId !== user.portfolio_id;

  return (
    <Modal open onClose={onClose}>
      <ModalDialog
        size="md"
        variant="outlined"
        sx={{ maxWidth: 500, width: '90%' }}
      >
        <ModalClose />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PersonIcon color="primary" />
          <Box>
            <Typography level="h4">Edit User Permissions</Typography>
            <Typography level="body-sm" sx={{ color: 'neutral.600' }}>
              Manage role and portfolio assignments for {user.username}
            </Typography>
          </Box>
        </Box>

        {/* User Info */}
        <Box sx={{ p: 2, bgcolor: 'neutral.50', borderRadius: 'sm', mb: 3 }}>
          <Typography level="body-sm" fontWeight="lg" sx={{ mb: 1 }}>
            User Information
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-sm">Username:</Typography>
              <Typography level="body-sm" fontWeight="md">{user.username}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-sm">Email:</Typography>
              <Typography level="body-sm">{user.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-sm">Discord ID:</Typography>
              <Typography level="body-sm" sx={{ fontFamily: 'monospace', fontSize: 'xs' }}>
                {user.discord_id || 'Not linked'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Current vs New Permissions */}
        <Stack spacing={3}>
          <Box>
            <Typography level="body-sm" fontWeight="lg" sx={{ mb: 2 }}>
              Current Permissions
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography level="body-sm">Role:</Typography>
                <Chip size="sm" variant="soft" color="neutral">
                  {getCurrentRoleName()}
                </Chip>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography level="body-sm">Portfolio:</Typography>
                <Chip size="sm" variant="soft" color="neutral">
                  {getCurrentPortfolioName()}
                </Chip>
              </Box>
            </Stack>
          </Box>

          {/* New Permissions */}
          <Box>
            <Typography level="body-sm" fontWeight="lg" sx={{ mb: 2 }}>
              New Permissions
            </Typography>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={selectedRoleId}
                  onChange={(_, value) => setSelectedRoleId(value as number)}
                >
                  {roles.map(role => (
                    <Option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                      {role.description && (
                        <Typography level="body-xs" sx={{ color: 'neutral.500', display: 'block' }}>
                          {role.description}
                        </Typography>
                      )}
                    </Option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Portfolio</FormLabel>
                <Select
                  value={selectedPortfolioId}
                  onChange={(_, value) => setSelectedPortfolioId(value as number | null)}
                >
                  <Option value={null}>Unassigned</Option>
                  {portfolios.map(portfolio => (
                    <Option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                      {portfolio.name}
                      {portfolio.description && (
                        <Typography level="body-xs" sx={{ color: 'neutral.500', display: 'block' }}>
                          {portfolio.description}
                        </Typography>
                      )}
                    </Option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Changes Summary */}
          {hasChanges && (
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 'sm', border: '1px solid', borderColor: 'primary.200' }}>
              <Typography level="body-sm" fontWeight="lg" sx={{ mb: 1, color: 'primary.700' }}>
                Changes to be applied:
              </Typography>
              <Stack spacing={0.5}>
                {selectedRoleId !== user.role_id && (
                  <Typography level="body-xs" sx={{ color: 'primary.600' }}>
                    • Role: {getCurrentRoleName()} → {getSelectedRoleName()}
                  </Typography>
                )}
                {selectedPortfolioId !== user.portfolio_id && (
                  <Typography level="body-xs" sx={{ color: 'primary.600' }}>
                    • Portfolio: {getCurrentPortfolioName()} → {getSelectedPortfolioName()}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="neutral"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={handleSave}
            loading={isLoading}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
} 