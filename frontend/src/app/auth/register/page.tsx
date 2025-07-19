import RegisterClient from "@/components/joyui/auth/RegisterClient";
import { APIError } from "@/lib/api/client";
import { createUser } from "@/lib/api/user";
import { redirect } from "next/navigation";

async function handleRegister(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !username || !password) {
    throw new Error("Please fill in all required fields");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  // Validate password length
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  try {
    await createUser({ email, username, password });
  } catch (error) {
    console.error("Registration failed:", error);

    // Handle actual registration errors
    if (error instanceof APIError) {
      const errorMessage = error.message.toLowerCase();

      // Email related errors
      if (errorMessage.includes("email already exists") ||
        (errorMessage.includes("email") && errorMessage.includes("exists"))) {
        throw new Error("This email is already registered. Please use another email or log in directly.");
      }

      // Username related errors
      if (errorMessage.includes("username already exists") ||
        (errorMessage.includes("username") && errorMessage.includes("exists"))) {
        throw new Error("This username is already taken. Please choose another username.");
      }

      // Password related errors
      if (errorMessage.includes("password")) {
        if (errorMessage.includes("weak") || errorMessage.includes("strength")) {
          throw new Error("Password is too weak. Please use a more complex password.");
        } else if (errorMessage.includes("common")) {
          throw new Error("Password is too common. Please use a more unique password.");
        } else {
          throw new Error("Password does not meet the requirements.");
        }
      }

      // Email format errors
      if (errorMessage.includes("invalid email") || errorMessage.includes("email format")) {
        throw new Error("Invalid email format. Please check and try again.");
      }

      // Username format errors
      if (errorMessage.includes("invalid username") || errorMessage.includes("username format")) {
        throw new Error("Username does not meet the requirements.");
      }

      // Rate limit errors
      if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
        throw new Error("Registration requests are too frequent. Please try again later.");
      }

      // Validation errors (422)
      if (error.status === 422) {
        const details = error.details as { detail?: unknown };
        if (details && details.detail !== undefined) {
          // Handle FastAPI validation errors
          if (Array.isArray(details.detail)) {
            const validationErrors = details.detail.map((err: { loc?: string[]; msg: string }) => {
              const field = err.loc?.[err.loc.length - 1] || 'field';
              const fieldName = field === 'email' ? 'Email' :
                field === 'username' ? 'Username' :
                  field === 'password' ? 'Password' : field;
              return `${fieldName}: ${err.msg}`;
            }).join('; ');
            throw new Error(`Input validation failed: ${validationErrors}`);
          } else {
            throw new Error(`Input validation failed: ${details.detail}`);
          }
        } else {
          throw new Error("Input data format error. Please check and try again.");
        }
      }

      // Server errors
      if (error.status >= 500) {
        throw new Error("The server is temporarily unavailable. Please try again later.");
      }

      // Permission errors
      if (error.status === 403) {
        throw new Error("Registration of new users is currently not allowed. Please contact the administrator.");
      }

      // Other API errors
      throw new Error(error.message || "Registration failed. Please try again later.");

    } else if (error instanceof Error) {
      // Network or other errors
      if (error.message.includes("fetch")) {
        throw new Error("Network connection failed. Please check your network and try again.");
      } else if (error.message.includes("timeout")) {
        throw new Error("Request timed out. Please try again later.");
      } else {
        throw new Error(error.message);
      }
    } else {
      throw new Error("Registration failed, please try again later.");
    }
  }

  // Redirect after successful registration - placed outside try-catch to avoid redirect errors
  redirect("/auth/login?message=Registration successful, please log in");
}

export default function RegisterPage() {
  return <RegisterClient registerAction={handleRegister} />;
}
