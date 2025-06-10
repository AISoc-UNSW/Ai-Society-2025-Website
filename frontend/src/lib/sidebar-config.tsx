import React from "react";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { VideoChatRounded } from "@mui/icons-material";
import { UserProfile } from "./types";

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  children?: SidebarItem[];
  defaultExpanded?: boolean;
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
        selected: true, // current page
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: <AssignmentRoundedIcon />,
        defaultExpanded: false,
        children: [
          {
            id: "all-tasks",
            label: "All tasks",
            href: "/taskbot/tasks/all",
          },
          {
            id: "in-progress",
            label: "In progress",
            href: "/taskbot/tasks/in-progress",
          },
          {
            id: "completed",
            label: "Completed",
            href: "/taskbot/tasks/completed",
          },
          {
            id: "cancelled",
            label: "Cancelled",
            href: "/taskbot/tasks/cancelled",
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
            href: "/profile",
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
            href: "/users/roles",
          },
        ],
      },
    ],
  },
//   {
//     id: "footer",
//     position: "bottom",
//     items: [
//       {
//         id: "support",
//         label: "Support",
//         icon: <SupportRoundedIcon />,
//         href: "/support",
//       },
//       {
//         id: "settings",
//         label: "Settings",
//         icon: <SettingsRoundedIcon />,
//         href: "/settings",
//       },
//     ],
//   },
];

export const currentUser: UserProfile = {
  name: "Siriwat K.",
  email: "siriwatk@test.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286",
};

export interface BrandConfig {
  name: string;
  icon?: React.ReactNode;
}

export const brandConfig: BrandConfig = {
  name: "TaskBot",
  // icon: <BrightnessAutoRoundedIcon />, // optional icon
};
