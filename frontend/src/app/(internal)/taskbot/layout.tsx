import { UserProvider } from "@/components/providers/UserProvider";
import { getCurrentUser } from "@/lib/api/user";

export default async function TaskbotLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en">
      <body>
        <UserProvider initialUser={user || undefined}>
          {/* Layout UI */}
          {/* Place children where you want to render a page or nested layout */}
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
