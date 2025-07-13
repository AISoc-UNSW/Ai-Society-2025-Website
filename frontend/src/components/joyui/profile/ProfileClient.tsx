'use client';

import {
    PortfolioListResponse,
    RoleListResponse,
    UserListResponse,
    UserProfileUpdate,
} from '@/lib/types';
import PersonIcon from '@mui/icons-material/Person';
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Option,
    Select,
    Stack,
    Typography,
} from '@mui/joy';
import { useMemo, useState } from 'react';

interface ProfileClientProps {
  user: UserListResponse;
  roles: RoleListResponse[];
  portfolios: PortfolioListResponse[];
  onSave: (updates: UserProfileUpdate) => Promise<{ success: boolean; message?: string }>;
}

export default function ProfileClient({ user, roles, portfolios, onSave }: ProfileClientProps) {
  const [username, setUsername] = useState(user.username);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(user.portfolio_id || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roleName = useMemo(() => {
    return roles.find((r) => r.role_id === user.role_id)?.role_name || 'Unknown';
  }, [user.role_id, roles]);
  


  const hasPortfolioAssigned = user.portfolio_id !== null;
  const hasChanges = username !== user.username || selectedPortfolioId !== user.portfolio_id;

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const updates: UserProfileUpdate = {};
    if (username !== user.username) {
      updates.username = username;
    }
    if (selectedPortfolioId !== user.portfolio_id) {
      updates.portfolio_id = selectedPortfolioId || undefined;
    }

    const result = await onSave(updates);
    if (result.success) {
      setSuccess('Profile updated successfully!');
    } else {
      setError(result.message || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };

  const handleDiscordBind = () => {
    // Redirect to Discord OAuth endpoint
    window.location.href = '/api/v1/auth/discord/';
  };

  return (
    <Box sx={{ p: 4, maxWidth: 700, margin: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <PersonIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography level="h2">My Profile</Typography>
          <Typography level="body-sm" sx={{ color: 'neutral.600' }}>
            Manage your personal information and settings
          </Typography>
        </Box>
      </Box>

      <Card variant="outlined" sx={{ p: 4 }}>
        <Stack spacing={3}>
          {/* Read-only Fields */}
          <Box>
            <Typography level="body-sm" fontWeight="lg" sx={{ mb: 2, color: 'neutral.700' }}>
              Account Information
            </Typography>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>User ID</FormLabel>
                <Input value={user.user_id.toString()} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={user.email} disabled />
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input value={roleName} disabled />
                <FormHelperText>Your role is assigned by administrators</FormHelperText>
              </FormControl>
            </Stack>
          </Box>

          {/* Editable Fields */}
          <Box>
            <Typography level="body-sm" fontWeight="lg" sx={{ mb: 2, color: 'neutral.700' }}>
              Personal Settings
            </Typography>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
                <FormHelperText>This is how your name will appear to other users</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Portfolio</FormLabel>
                <Select
                  value={selectedPortfolioId}
                  onChange={(_, newValue) => setSelectedPortfolioId(newValue)}
                  disabled={hasPortfolioAssigned}
                  renderValue={(option) => {
                    if (option) {
                      if (option.value === null) return 'Unassigned';
                      const portfolio = portfolios.find(p => p.portfolio_id === option.value);
                      return portfolio?.name || 'Unknown';
                    }
                    return '';
                  }}
                >
                  <Option value={null}>Unassigned</Option>
                  {portfolios.map((p) => (
                    <Option key={p.portfolio_id} value={p.portfolio_id}>
                      <Box>
                        <Typography level="body-sm" component="div" fontWeight="md">
                          {p.name}
                        </Typography>
                        {p.description && (
                          <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                            {p.description}
                          </Typography>
                        )}
                      </Box>
                    </Option>
                  ))}
                </Select>
                {hasPortfolioAssigned ? (
                  <FormHelperText>
                    Your portfolio has been assigned and cannot be changed. Contact an administrator if you need to change it.
                  </FormHelperText>
                ) : (
                  <FormHelperText>
                    Choose your portfolio carefully - you can only set this once.
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Discord Account</FormLabel>
                {user.discord_id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip variant="soft" color="success" size="lg">
                      Linked: {user.discord_id}
                    </Chip>
                    <Typography level="body-xs" sx={{ color: 'neutral.600' }}>
                      Your Discord account is successfully linked
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Button 
                      onClick={handleDiscordBind} 
                      variant="outlined" 
                      color="primary"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Link Discord Account
                    </Button>
                    <FormHelperText sx={{ mt: 1 }}>
                      Link your Discord account to receive notifications and participate in voice meetings
                    </FormHelperText>
                  </Box>
                )}
              </FormControl>
            </Stack>
          </Box>

          {/* Status Messages */}
          {error && (
            <Alert color="danger" variant="soft">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="success" variant="soft">
              {success}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              onClick={handleSave}
              loading={isLoading}
              disabled={!hasChanges}
              variant="solid"
              color="primary"
            >
              {hasChanges ? 'Save Changes' : 'No Changes to Save'}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
} 