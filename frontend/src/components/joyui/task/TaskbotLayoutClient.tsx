"use client";

import React from "react";
import Box from "@mui/joy/Box";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Sidebar from "@/components/joyui/Sidebar";

interface TaskbotLayoutClientProps {
  children: React.ReactNode;
}

export default function TaskbotLayoutClient({ children }: TaskbotLayoutClientProps) {
  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <Box
          component="main"
          className="MainContent"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            backgroundColor: "background.surface",
            minHeight: "100vh",
          }}
        >
          {children}
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
