"use client";

import MyTasks from "@/components/joyui/MyTasks";
import Sidebar from "@/components/joyui/Sidebar";
import { tasks } from "@/lib/data";
import { CssBaseline, CssVarsProvider } from "@mui/joy";
import Box from "@mui/joy/Box";

export default function TaskDashboard() {
  // Filter tasks to show only current user's tasks (simplified - in real app, filter by user ID)
  const userTasks = tasks;

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            backgroundColor: "background.surface",
            minHeight: "100vh",
          }}
        >
          <MyTasks tasks={userTasks} />
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
