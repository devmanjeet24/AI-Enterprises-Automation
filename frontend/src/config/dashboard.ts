import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  GitBranch,
  Globe,
  Headphones,
  Inbox,
  LayoutDashboard,
  Mic,
  Network,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { PERMISSIONS } from "@/lib/auth/permissions";
import type { PermissionNavItem } from "@/lib/auth/nav-access";

export interface DashboardNavItem extends PermissionNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    label: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    enabled: true,
    readPermissions: [PERMISSIONS.ORGANIZATIONS_READ],
  },
  {
    label: "AI Employees",
    href: "/ai-employees",
    icon: Users,
    enabled: true,
    readPermissions: [PERMISSIONS.EMPLOYEES_READ],
  },
  {
    label: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
    enabled: true,
    readPermissions: [PERMISSIONS.DOCUMENTS_READ],
  },
  {
    label: "Agent Teams",
    href: "/agent-teams",
    icon: Network,
    enabled: true,
    readPermissions: [PERMISSIONS.AGENT_TEAMS_READ],
  },
  {
    label: "Workflows",
    href: "/workflows",
    icon: GitBranch,
    enabled: true,
    readPermissions: [PERMISSIONS.WORKFLOWS_READ],
  },
  {
    label: "Research Hub",
    href: "/research-hub",
    icon: Search,
    enabled: true,
    readPermissions: [PERMISSIONS.RESEARCH_PROJECTS_READ],
  },
  {
    label: "Browser Automation",
    href: "/browser-automation",
    icon: Globe,
    enabled: true,
    readPermissions: [
      PERMISSIONS.BROWSER_PROFILES_READ,
      PERMISSIONS.BROWSER_TASKS_READ,
    ],
  },
  {
    label: "Customer Support",
    href: "/customer-support",
    icon: Headphones,
    enabled: true,
    readPermissions: [PERMISSIONS.SUPPORT_TICKETS_READ],
  },
  {
    label: "Voice Assistant",
    href: "/voice-ai",
    icon: Mic,
    enabled: true,
    readPermissions: [PERMISSIONS.VOICE_AGENTS_READ],
  },
  {
    label: "Omnichannel",
    href: "/omnichannel",
    icon: Inbox,
    enabled: true,
    readPermissions: [
      PERMISSIONS.OMNICHANNEL_CHANNELS_READ,
      PERMISSIONS.OMNICHANNEL_CONVERSATIONS_READ,
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    enabled: true,
    readPermissions: [PERMISSIONS.ORGANIZATIONS_READ],
  },
];

export const dashboardSettingsItem: DashboardNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  enabled: true,
  readPermissions: [
    PERMISSIONS.ORGANIZATIONS_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.PERMISSIONS_READ,
  ],
};
