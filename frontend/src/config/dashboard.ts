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
  { label: "Browser Automation", href: "/browser-automation", icon: Globe, enabled: true },
  { label: "Customer Support", href: "/customer-support", icon: Headphones, enabled: true },
  { label: "Voice AI", href: "/voice-ai", icon: Mic, enabled: true },
  { label: "Omnichannel", href: "/omnichannel", icon: Inbox, enabled: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, enabled: true },
];

export const dashboardSettingsItem: DashboardNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  enabled: true,
};
