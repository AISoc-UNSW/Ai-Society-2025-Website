import { loginUser } from "@/lib/api/user";
import { setAuthToken } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginClient from "@/components/joyui/auth/LoginClient";

async function handleLogin(formData: FormData) {
  "use server";

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    const response = await loginUser({ username, password });
    await setAuthToken(response.access_token);
    redirect("/taskbot/dashboard");
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export default function LoginPage() {
  return <LoginClient loginAction={handleLogin} />;
}
