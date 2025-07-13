import ProfileClient from '@/components/joyui/profile/ProfileClient';
import { getAllPortfolios, getAllRoles } from '@/lib/api/permissions';
import { updateUserProfile } from '@/lib/api/user';
import { getCurrentUser } from '@/lib/session';
import { UserProfileUpdate } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Server Action: Handle profile updates
async function updateUserProfileAction(updates: UserProfileUpdate) {
  'use server';
  try {
    const result = await updateUserProfile(updates);
    revalidatePath('/taskbot/profile'); // Refresh page data after successful update
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred.' 
    };
  }
}

export default async function ProfilePage() {
  // Get current user information
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  try {
    // Fetch all required data in parallel
    const [roles, portfolios] = await Promise.all([
      getAllRoles(),
      getAllPortfolios(),
    ]);

    return (
      <ProfileClient
        user={user}
        roles={roles}
        portfolios={portfolios}
        onSave={updateUserProfileAction}
      />
    );
  } catch (error) {
    console.error('Failed to load profile page data:', error);
    
    // Return error state or redirect
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Error Loading Profile</h1>
        <p>Failed to load profile data. Please try again later.</p>
      </div>
    );
  }
} 