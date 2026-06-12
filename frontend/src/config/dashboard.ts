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
  { label: "AI Employees", href: "/ai-employees", icon: Users, enabled: false },
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, enabled: false },
  { label: "Agent Teams", href: "/agent-teams", icon: Network, enabled: false },
  { label: "Workflows", href: "/workflows", icon: GitBranch, enabled: false },
  { label: "Research Hub", href: "/research-hub", icon: Search, enabled: false },
  { label: "Browser Automation", href: "/browser-automation", icon: Globe, enabled: false },
  { label: "Analytics", href: "/analytics", icon: BarChart3, enabled: false },
];

export const dashboardSettingsItem: DashboardNavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
  enabled: false,
};

export const overviewQuickStats = [
  { label: "Active agents", value: 72, accent: "emerald" as const },
  { label: "Tasks completed", value: 58, accent: "blue" as const },
  { label: "Knowledge coverage", value: 84, accent: "purple" as const },
  { label: "Workflow success", value: 96, accent: "gold" as const },
] as const;

export const overviewKpis = [
  {
    label: "AI Employees",
    value: "24",
    change: "+3 this month",
    trend: "up" as const,
    accent: "emerald" as const,
  },
  {
    label: "Tasks automated",
    value: "12.4k",
    change: "+18% vs last week",
    trend: "up" as const,
    accent: "blue" as const,
  },
  {
    label: "Avg response time",
    value: "1.2s",
    change: "−0.3s improvement",
    trend: "up" as const,
    accent: "purple" as const,
  },
  {
    label: "Success rate",
    value: "98.2%",
    change: "Stable",
    trend: "neutral" as const,
    accent: "gold" as const,
  },
] as const;

export const recentActivity = [
  {
    id: "1",
    title: "Support Agent resolved ticket #4821",
    description: "Drafted reply with KB citation — Policy Refund v2.1",
    time: "2 min ago",
    type: "agent" as const,
  },
  {
    id: "2",
    title: "Workflow completed: Lead enrichment",
    description: "12 records processed · 11 successful",
    time: "14 min ago",
    type: "workflow" as const,
  },
  {
    id: "3",
    title: "Knowledge base updated",
    description: "Security Policy.docx indexed — 847 new chunks",
    time: "1 hr ago",
    type: "knowledge" as const,
  },
  {
    id: "4",
    title: "Research report generated",
    description: "Competitive landscape Q2 — ready for review",
    time: "3 hr ago",
    type: "research" as const,
  },
  {
    id: "5",
    title: "Browser task completed",
    description: "Vendor portal order status extracted",
    time: "5 hr ago",
    type: "browser" as const,
  },
] as const;

export const aiEmployeeStatus = [
  {
    id: "1",
    name: "Support Agent",
    role: "Customer Support",
    status: "active" as const,
    tasksToday: 47,
    uptime: "99.9%",
  },
  {
    id: "2",
    name: "Research Analyst",
    role: "Market Intelligence",
    status: "active" as const,
    tasksToday: 12,
    uptime: "100%",
  },
  {
    id: "3",
    name: "Ops Coordinator",
    role: "Operations",
    status: "idle" as const,
    tasksToday: 8,
    uptime: "99.7%",
  },
  {
    id: "4",
    name: "Sales Assistant",
    role: "Revenue",
    status: "active" as const,
    tasksToday: 31,
    uptime: "99.8%",
  },
] as const;

export const workflowSummary = [
  {
    id: "1",
    name: "Ticket triage & reply",
    status: "running" as const,
    progress: 78,
    runsToday: 156,
  },
  {
    id: "2",
    name: "Lead enrichment pipeline",
    status: "running" as const,
    progress: 45,
    runsToday: 42,
  },
  {
    id: "3",
    name: "Weekly compliance scan",
    status: "scheduled" as const,
    progress: 0,
    runsToday: 0,
  },
  {
    id: "4",
    name: "Onboarding sequence",
    status: "completed" as const,
    progress: 100,
    runsToday: 8,
  },
] as const;

export const defaultOrganization = {
  name: "Acme Corporation",
  plan: "Enterprise",
  memberCount: 48,
  agentCount: 24,
};
