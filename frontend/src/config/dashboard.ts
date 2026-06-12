import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  GitBranch,
  Globe,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  Users,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
}

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, enabled: true },
  { label: "AI Employees", href: "/ai-employees", icon: Users, enabled: true },
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, enabled: true },
  { label: "Agent Teams", href: "/agent-teams", icon: Network, enabled: true },
  { label: "Workflows", href: "/workflows", icon: GitBranch, enabled: true },
  { label: "Research Hub", href: "/research-hub", icon: Search, enabled: true },
  { label: "Browser Automation", href: "/browser-automation", icon: Globe, enabled: false },
  { label: "Analytics", href: "/analytics", icon: BarChart3, enabled: false },
];

export const dashboardSettingsItem: DashboardNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  enabled: false,
};
