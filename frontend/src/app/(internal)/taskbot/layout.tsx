import TaskbotLayoutClient from "@/components/joyui/task/TaskbotLayoutClient";
import { UserProvider } from "@/components/providers/UserProvider";
import { getCurrentUser } from "@/lib/session";

export default async function TaskbotLayout({ children }: { children: React.ReactNode }) {
  const userResponse = await getCurrentUser().catch(() => null);
  
  // Convert UserListResponse to User type for UserProvider
  const user = userResponse ? {
    ...userResponse,
    portfolio_id: userResponse.portfolio_id || 0, // Provide default value
    is_active: true, // Default value since this info isn't in UserListResponse
    created_at: '', // Default empty string
    updated_at: '', // Default empty string
  } : undefined;

  return (
    <UserProvider initialUser={user || undefined}>
      <TaskbotLayoutClient>{children}</TaskbotLayoutClient>
    </UserProvider>
  );
}
