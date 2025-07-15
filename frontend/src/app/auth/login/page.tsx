import LoginClient from "@/components/joyui/auth/LoginClient";
import { APIError } from "@/lib/api/client";
import { loginUser } from "@/lib/api/user";
import { setAuthToken } from "@/lib/session";
import { redirect } from "next/navigation";

async function handleLogin(formData: FormData) {
  "use server";

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!username || !password) {
    throw new Error("Please enter username and password");
  }

  try {
    const response = await loginUser({ username, password });
    await setAuthToken(response.access_token);
  } catch (error) {
    console.error("Login failed:", error);

    // Return friendly error message
    if (error instanceof APIError) {
      throw new Error(error.message);
    } else if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Login failed. Please try again later.");
    }
  }

  redirect("/taskbot/dashboard");
}

export default function LoginPage() {
  return <LoginClient loginAction={handleLogin} />;
}
