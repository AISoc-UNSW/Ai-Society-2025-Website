import { VideoChatRounded } from "@mui/icons-material";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import React from "react";
import { UserProfile } from "./types";
import { VideoChatRounded } from "@mui/icons-material";

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
        id: "home",
        label: "Home",
        icon: <HomeRoundedIcon />,
        href: "/",
      },
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
            id: "create-user",
            label: "Create a new user",
            href: "/users/create",
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
  // icon: <BrightnessAutoRoundedIcon />, // optional icon
};
