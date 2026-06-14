export interface DashboardOverview {
  total_users: number;
  total_departments: number;
  total_teams: number;
  total_documents: number;
  total_ai_employees: number;
  total_agent_tasks: number;
  total_workflows: number;
  total_research_projects: number;
  total_browser_tasks: number;
}

export type OverviewActivityType =
  | "agent"
  | "workflow"
  | "knowledge"
  | "research"
  | "browser";

export interface OverviewActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  type: OverviewActivityType;
  href?: string;
}

export interface OverviewKpiItem {
  label: string;
  value: string;
  change: string;
  trend: "up" | "neutral";
  accent: "emerald" | "blue" | "purple" | "gold";
}

export interface OverviewQuickStat {
  label: string;
  value: number;
  accent: "emerald" | "blue" | "purple" | "gold";
}

export type OverviewWorkflowDisplayStatus =
  | "running"
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "ready"
  | "draft"
  | "archived"
  | "inactive";

export interface OverviewWorkflowItem {
  id: string;
  name: string;
  status: OverviewWorkflowDisplayStatus;
  progress: number;
  runsToday: number;
}

export interface OverviewEmployeeItem {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  tasksToday: number | null;
}

export interface OverviewPlatformMetric {
  label: string;
  value: string;
  detail: string;
  accent: "emerald" | "blue" | "purple" | "gold" | "neutral";
}
