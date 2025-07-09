import { getCurrentUser } from "@/lib/api/user";
import { UserProvider } from "@/components/providers/UserProvider";
import TaskbotLayoutClient from "@/components/joyui/task/TaskbotLayoutClient";

export default async function TaskbotLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en">
      <body>
        <UserProvider initialUser={user || undefined}>
          <TaskbotLayoutClient>{children}</TaskbotLayoutClient>
        </UserProvider>
      </body>
    </html>
  );
}
