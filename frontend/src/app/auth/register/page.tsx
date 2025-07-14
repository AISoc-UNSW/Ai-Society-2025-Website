import { createUser } from "@/lib/api/user";
import { redirect } from "next/navigation";
import RegisterClient from "@/components/joyui/auth/RegisterClient";

async function handleRegister(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await createUser({ email, username, password });
    redirect("/auth/login");
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

export default function RegisterPage() {
  return <RegisterClient registerAction={handleRegister} />;
}
