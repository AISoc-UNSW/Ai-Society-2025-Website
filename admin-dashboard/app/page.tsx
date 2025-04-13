import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to tasks page by default
  redirect("/tasks")
}

