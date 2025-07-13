import { VideoChatRounded } from "@mui/icons-material";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import React from "react";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  children?: SidebarItem[];
  defaultExpanded?: boolean;
  requiresRoles?: string[]; // Required roles to access this item (any of these roles)
}

export interface SidebarSection {
  id: string;
  items: SidebarItem[];
  position?: "top" | "bottom";
}

export const sidebarConfig: SidebarSection[] = [
  {
    id: "main",
    position: "top",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <DashboardRoundedIcon />,
        href: "/taskbot/dashboard",
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: <AssignmentRoundedIcon />,
        defaultExpanded: false,
        children: [
          {
            id: "my-tasks",
            label: "My Tasks",
            href: "/taskbot/tasks/my-tasks",
          },
          {
            id: "all-tasks",
            label: "All Tasks",
            href: "/taskbot/tasks/all",
          },
          {
            id: "created-tasks",
            label: "Created Tasks",
            href: "/taskbot/tasks/created-tasks",
          },
        ],
      },
      {
        id: "meetings",
        label: "Meetings",
        icon: <VideoChatRounded />,
        href: "/taskbot/meetings",
      },
      {
        id: "users",
        label: "Users",
        icon: <GroupRoundedIcon />,
        defaultExpanded: true,
        children: [
          {
            id: "my-profile",
            label: "My profile",
            href: "/taskbot/profile",
            selected: false,
          },
          {
            id: "roles",
            label: "Roles & permission",
            href: "/taskbot/admin/permissions",
            requiresRoles: ["admin"], // Allow both director and admin
          },
        ],
      },
    ],
  },
];

export interface BrandConfig {
  name: string;
  icon?: React.ReactNode;
}

export const brandConfig: BrandConfig = {
  name: "TaskBot",
  icon: (
    <svg width="36" height="36" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect
        x="16"
        y="12"
        width="32"
        height="24"
        rx="6"
        fill="#4CAF50"
        stroke="#2E7D32"
        stroke-width="2"
      />
      <circle cx="24" cy="24" r="3" fill="white" />
      <circle cx="40" cy="24" r="3" fill="white" />

      <line x1="32" y1="4" x2="32" y2="12" stroke="#4CAF50" stroke-width="2" />
      <circle cx="32" cy="4" r="2" fill="#4CAF50" />

      <rect
        x="20"
        y="36"
        width="24"
        height="18"
        rx="4"
        fill="#81C784"
        stroke="#2E7D32"
        stroke-width="2"
      />

      <line
        x1="16"
        y1="38"
        x2="10"
        y2="44"
        stroke="#4CAF50"
        stroke-width="2"
        stroke-linecap="round"
      />
      <line
        x1="48"
        y1="38"
        x2="54"
        y2="44"
        stroke="#4CAF50"
        stroke-width="2"
        stroke-linecap="round"
      />

      <rect x="27" y="42" width="10" height="10" rx="2" fill="white" />
      <polyline points="29,47 31,49 35,43" fill="none" stroke="#4CAF50" stroke-width="2" />

      <line x1="26" y1="54" x2="26" y2="60" stroke="#4CAF50" stroke-width="2" />
      <line x1="38" y1="54" x2="38" y2="60" stroke="#4CAF50" stroke-width="2" />
    </svg>
  ),
};
