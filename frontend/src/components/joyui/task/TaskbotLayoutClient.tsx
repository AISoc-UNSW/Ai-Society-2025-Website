"use client";

import React from "react";
import Box from "@mui/joy/Box";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import IconButton from "@mui/joy/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "@/components/joyui/Sidebar";
import { openSidebar } from "@/lib/dom-utils";

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
            // Ensure proper width calculation on mobile
            width: {
              xs: "100vw", // Full width on mobile (sidebar is fixed/hidden)
              md: "calc(100vw - var(--Sidebar-width))", // Subtract sidebar width on desktop
            },
            maxWidth: "100vw",
            overflow: "hidden", // Prevent horizontal scroll
            position: "relative",
            // Add top padding on mobile to avoid overlap with menu button
            pt: { xs: 7, md: 3 }, // 7 units on mobile (about 56px), normal on desktop
          }}
        >
          {/* Mobile Menu Button */}
          <IconButton
            variant="outlined"
            color="neutral"
            onClick={openSidebar}
            sx={{
              display: { xs: "flex", md: "none" }, // Only show on mobile
              position: "absolute", // Changed from fixed to absolute
              top: 16,
              left: 16,
              zIndex: 9999,
              backgroundColor: "background.surface",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                backgroundColor: "background.level1",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {children}
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
