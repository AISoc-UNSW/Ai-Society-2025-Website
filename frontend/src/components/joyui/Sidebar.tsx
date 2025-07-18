import BrightnessAutoRoundedIcon from "@mui/icons-material/BrightnessAutoRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import GlobalStyles from "@mui/joy/GlobalStyles";
import IconButton from "@mui/joy/IconButton";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton, { listItemButtonClasses } from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import ColorSchemeToggle from "@/components/joyui/ColorSchemeToggle";
import { closeSidebar } from "@/lib/dom-utils";
import {
  brandConfig,
  sidebarConfig,
  type SidebarItem,
  type SidebarSection,
} from "@/lib/sidebar-config";
import { getEmailAvatarColor, getEmailInitials } from "@/lib/utils";
import { useLogout, useUser } from "@/stores/userStore";

function Toggler({
  defaultExpanded = false,
  renderToggle,
  children,
  keepOpenWhenChildSelected = false,
  hasSelectedChild = false,
}: {
  defaultExpanded?: boolean;
  children: React.ReactNode;
  renderToggle: (params: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
  keepOpenWhenChildSelected?: boolean;
  hasSelectedChild?: boolean;
}) {
  // Use the child selected state to determine initial expansion, but allow manual control
  const initialExpanded = defaultExpanded || (keepOpenWhenChildSelected && hasSelectedChild);
  const [open, setOpen] = React.useState(initialExpanded);
  const [hasBeenManuallyToggled, setHasBeenManuallyToggled] = React.useState(false);

  // Only auto-open when navigating to a child page if user hasn't manually toggled
  React.useEffect(() => {
    if (keepOpenWhenChildSelected && hasSelectedChild && !open && !hasBeenManuallyToggled) {
      setOpen(true);
    }
  }, [hasSelectedChild, keepOpenWhenChildSelected, open, hasBeenManuallyToggled]);

  // Wrap setOpen to track manual toggles
  const handleSetOpen = React.useCallback((newOpen: boolean | ((prev: boolean) => boolean)) => {
    setHasBeenManuallyToggled(true);
    if (typeof newOpen === "function") {
      setOpen(newOpen);
    } else {
      setOpen(newOpen);
    }
  }, []);

  return (
    <React.Fragment>
      {renderToggle({ open, setOpen: handleSetOpen })}
      <Box
        sx={[
          {
            display: "grid",
            transition: "0.2s ease",
            "& > *": {
              overflow: "hidden",
            },
          },
          open ? { gridTemplateRows: "1fr" } : { gridTemplateRows: "0fr" },
        ]}
      >
        {children}
      </Box>
    </React.Fragment>
  );
}

interface SidebarItemProps {
  item: SidebarItem;
  currentPath: string;
  onNavigate: (href: string) => void;
  userRole?: string;
}

function SidebarItemComponent({ item, currentPath, onNavigate, userRole }: SidebarItemProps) {
  const isSelected = Boolean(item.selected) || Boolean(item.href && currentPath === item.href);

  // Check if user has required roles
  if (item.requiresRoles && !item.requiresRoles.includes(userRole || "")) {
    return null; // Don't render item if user doesn't have required role
  }

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      onNavigate(item.href);
    }
  };

  // Simple item without children
  if (!item.children || item.children.length === 0) {
    return (
      <ListItem>
        <ListItemButton selected={isSelected} onClick={handleClick}>
          {item.icon}
          <ListItemContent>
            <Typography level="title-sm">{item.label}</Typography>
          </ListItemContent>
        </ListItemButton>
      </ListItem>
    );
  }

  // Filter children based on user role and check if any are selected
  const visibleChildren =
    item.children?.filter(
      child => !child.requiresRoles || child.requiresRoles.includes(userRole || "")
    ) || [];

  const hasSelectedChild = visibleChildren.some(
    child => Boolean(child.selected) || Boolean(child.href && currentPath === child.href)
  );

  // If no children are visible, don't render the parent item
  if (item.children && visibleChildren.length === 0) {
    return null;
  }

  // Nested item with children
  return (
    <ListItem nested>
      <Toggler
        defaultExpanded={item.defaultExpanded}
        keepOpenWhenChildSelected={true}
        hasSelectedChild={hasSelectedChild}
        renderToggle={({ open, setOpen }) => (
          <ListItemButton onClick={() => setOpen(!open)}>
            {item.icon}
            <ListItemContent>
              <Typography level="title-sm">{item.label}</Typography>
            </ListItemContent>
            <KeyboardArrowDownIcon
              sx={[open ? { transform: "rotate(180deg)" } : { transform: "none" }]}
            />
          </ListItemButton>
        )}
      >
        <List sx={{ gap: 0.5 }}>
          {visibleChildren.map((child, index) => (
            <ListItem key={child.id} sx={index === 0 ? { mt: 0.5 } : {}}>
              <ListItemButton
                selected={
                  Boolean(child.selected) || Boolean(child.href && currentPath === child.href)
                }
                onClick={() => {
                  if (child.onClick) {
                    child.onClick();
                  } else if (child.href) {
                    onNavigate(child.href);
                  }
                }}
              >
                {child.icon}
                <ListItemContent>
                  <Typography level="body-sm">{child.label}</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Toggler>
    </ListItem>
  );
}

interface SidebarProps {
  config?: SidebarSection[];
  brand?: typeof brandConfig;
}

export default function Sidebar({ config = sidebarConfig, brand = brandConfig }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentUser = useUser();
  const logout = useLogout();

  const handleNavigate = (href: string) => {
    router.push(href);
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const user = currentUser || {
    username: "Loading...",
    email: "",
    avatar: "",
  };

  // Convert role_id to role name for permission checking
  const getUserRoleName = (roleId?: number): string => {
    switch (roleId) {
      case 1:
        return "user";
      case 2:
        return "admin";
      case 3:
        return "director";
      default:
        return "user";
    }
  };

  const userRole = getUserRoleName(currentUser?.role_id);

  const topSections = config.filter(section => section.position !== "bottom");
  const bottomSections = config.filter(section => section.position === "bottom");

  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        transform: {
          xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))",
          md: "none",
        },
        transition: "transform 0.4s, width 0.4s",
        zIndex: 10000,
        height: "100dvh",
        width: "var(--Sidebar-width)",
        top: 0,
        p: 2,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <GlobalStyles
        styles={theme => ({
          ":root": {
            "--Sidebar-width": "220px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "240px",
            },
          },
        })}
      />
      <Box
        className="Sidebar-overlay"
        sx={{
          position: "fixed",
          zIndex: 9998,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          opacity: "var(--SideNavigation-slideIn)",
          backgroundColor: "var(--joy-palette-background-backdrop)",
          transition: "opacity 0.4s",
          transform: {
            xs: "translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))",
            lg: "translateX(-100%)",
          },
        }}
        onClick={() => closeSidebar()}
      />

      {/* Brand Header */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <IconButton variant="soft" color="primary" size="sm">
          {brand.icon || <BrightnessAutoRoundedIcon />}
        </IconButton>
        <Typography level="title-lg">{brand.name}</Typography>
        <ColorSchemeToggle sx={{ ml: "auto" }} />
      </Box>

      {/* Main Navigation */}
      <Box
        sx={{
          minHeight: 0,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
          },
        }}
      >
        {/* Top Sections */}
        {topSections.map(section => (
          <List
            key={section.id}
            size="sm"
            sx={{
              gap: 1,
              "--List-nestedInsetStart": "30px",
              "--ListItem-radius": theme => theme.vars.radius.sm,
            }}
          >
            {section.items.map(item => (
              <SidebarItemComponent
                key={item.id}
                item={item}
                currentPath={pathname}
                onNavigate={handleNavigate}
                userRole={userRole}
              />
            ))}
          </List>
        ))}

        {/* Bottom Sections */}
        {bottomSections.length > 0 && (
          <List
            size="sm"
            sx={{
              mt: "auto",
              flexGrow: 0,
              "--ListItem-radius": theme => theme.vars.radius.sm,
              "--List-gap": "8px",
              mb: 2,
            }}
          >
            {bottomSections.map(section =>
              section.items.map(item => (
                <ListItem key={item.id}>
                  <ListItemButton
                    selected={
                      Boolean(item.selected) || Boolean(item.href && pathname === item.href)
                    }
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else if (item.href) {
                        handleNavigate(item.href);
                      }
                    }}
                  >
                    {item.icon}
                    <ListItemContent>
                      <Typography level="body-sm">{item.label}</Typography>
                    </ListItemContent>
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Box>

      {/* User Profile */}
      <Divider />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Avatar
          variant="outlined"
          size="sm"
          src={user.avatar}
          alt={user.username}
          sx={{
            backgroundColor: !user.avatar ? getEmailAvatarColor(user.email) : undefined,
            color: !user.avatar ? "white" : undefined,
            fontWeight: "bold",
          }}
        >
          {!user.avatar && getEmailInitials(user.email)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography level="title-sm">{user.username}</Typography>
          <Typography level="body-xs">{user.email}</Typography>
        </Box>
        <IconButton
          size="sm"
          variant="plain"
          color="neutral"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogoutRoundedIcon />
        </IconButton>
      </Box>
    </Sheet>
  );
}
