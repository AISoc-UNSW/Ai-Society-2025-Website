"use client";

import * as React from "react";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import Typography from "@mui/joy/Typography";
import LinearProgress from "@mui/joy/LinearProgress";

interface TaskLoadingStateProps {
  stage?: "fetching" | "transforming" | "filtering";
  progress?: number;
  totalTasks?: number;
  processedTasks?: number;
}

export default function TaskLoadingState({
  stage = "fetching",
  progress,
  totalTasks,
  processedTasks,
}: TaskLoadingStateProps) {
  const getStageMessage = () => {
    switch (stage) {
      case "fetching":
        return "Fetching tasks...";
      case "transforming":
        return `Processing tasks... ${processedTasks ? `(${processedTasks}/${totalTasks})` : ""}`;
      case "filtering":
        return "Filtering tasks...";
      default:
        return "Loading...";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: 2,
        p: 4,
      }}
    >
      <CircularProgress size="lg" />
      <Typography level="body-lg">{getStageMessage()}</Typography>

      {typeof progress === "number" && (
        <Box sx={{ width: "100%", maxWidth: 300 }}>
          <LinearProgress determinate value={progress} sx={{ mb: 1 }} />
          <Typography level="body-sm" textAlign="center">
            {Math.round(progress)}% complete
          </Typography>
        </Box>
      )}
    </Box>
  );
}
