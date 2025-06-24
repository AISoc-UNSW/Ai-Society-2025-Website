"use client";

import * as React from "react";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";
import Tooltip from "@mui/joy/Tooltip";
import { getEmailInitials, getEmailAvatarColor } from "@/lib/utils";

// User interface for the component
interface User {
  id: number | string;
  name?: string;
  username?: string;
  email: string;
  avatar?: string;
}

// Props for the UserSection component
interface AvatarsListProps {
  label: string;
  users: User[];
  size?: "sm" | "md" | "lg";
  maxAvatars?: number;
  showGroup?: boolean; // Whether to show as AvatarGroup or single Avatar
}

export default function AvatarsList({ 
  label, 
  users, 
  size = "sm", 
  maxAvatars = 5,
  showGroup = true 
}: AvatarsListProps) {
  if (!users || users.length === 0) {
    return null;
  }

  // For single user display (like Created by)
  if (!showGroup && users.length > 0) {
    const user = users[0];
    const displayName = user.name || user.username || user.email;
    
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", gap: 1 }}>
        <Typography level="body-xs" color="neutral">
          {label}
        </Typography>
        <Tooltip title={displayName}>
          <Avatar
            src={user.avatar}
            size={size}
            alt={displayName}
            aria-label={displayName}
            sx={{
              backgroundColor: !user.avatar ? getEmailAvatarColor(user.email) : undefined,
              color: !user.avatar ? "white" : undefined,
              fontWeight: "bold",
            }}
          >
            {!user.avatar && getEmailInitials(user.email)}
          </Avatar>
        </Tooltip>
      </Stack>
    );
  }

  // For multiple users display (like Assigned to)
  const displayUsers = users.slice(0, maxAvatars);
  const remainingCount = users.length - maxAvatars;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", gap: 1 }}>
      <Typography level="body-xs" color="neutral">
        {label}
      </Typography>
      <AvatarGroup size={size} sx={{ "--AvatarGroup-gap": "-8px" }}>
        {displayUsers.map(user => {
          const displayName = user.name || user.username || user.email;
          return (
            <Tooltip key={user.id} title={displayName}>
              <Avatar
                src={user.avatar}
                size={size}
                alt={displayName}
                aria-label={displayName}
                sx={{
                  backgroundColor: !user.avatar ? getEmailAvatarColor(user.email) : undefined,
                  color: !user.avatar ? "white" : undefined,
                  fontWeight: "bold",
                }}
              >
                {!user.avatar && getEmailInitials(user.email)}
              </Avatar>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Tooltip title={`+${remainingCount} more`}>
            <Avatar size={size} sx={{ backgroundColor: "neutral.300", color: "neutral.700" }}>
              +{remainingCount}
            </Avatar>
          </Tooltip>
        )}
      </AvatarGroup>
    </Stack>
  );
}