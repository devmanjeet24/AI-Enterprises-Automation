import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  GitBranch,
  Globe,
  LayoutDashboard,
  Network,
  Search,
  Users,
} from "lucide-react";

import { browserExecutionStatusLabels, browserTaskStatusLabels } from "@/config/browser-automation";
import { employeeStatusLabels } from "@/config/ai-employees";
import { taskStatusLabels } from "@/config/agent-teams";
import { researchStatusLabels, researchTemplateLabels } from "@/config/research-hub";
import { executionStatusLabels, workflowStatusLabels } from "@/config/workflows";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { PermissionNavItem } from "@/lib/auth/nav-access";
import type { BrowserAnalytics } from "@/lib/browser-automation/types";
import type { DashboardOverview } from "@/lib/dashboard/types";
import type { DashboardAccent } from "@/lib/dashboard-accents";
import type { ResearchAnalytics } from "@/lib/research-hub/types";

import type {
  AnalyticsChartSegment,
  AnalyticsInsightItem,
  AnalyticsKpiItem,
  ExecutiveAnalyticsSnapshot,
  AgentTeamsAnalyticsMetrics,
  AIEmployeeAnalyticsMetrics,
  KnowledgeAnalyticsMetrics,
  OrganizationAnalyticsMetrics,
  ReportsAnalyticsMetrics,
  WorkflowAnalyticsMetrics,
} from "@/lib/analytics/types";

export type AnalyticsNavSectionId =
  | "executive"
  | "organization"
  | "knowledge"
  | "ai-employees"
  | "agent-teams"
  | "workflows"
  | "research"
  | "browser-automation"
  | "reports";

export interface AnalyticsNavSection extends PermissionNavItem {
  id: AnalyticsNavSectionId;
  title: string;
  description: string;
  href: string;
  enabled: boolean;
  comingSoon?: boolean;
}

export const analyticsNavSections: AnalyticsNavSection[] = [
  {
    id: "executive",
    title: "Executive",
    description: "Organization-wide KPIs and cross-module activity.",
    href: "/analytics",
    enabled: true,
    readPermissions: [PERMISSIONS.ORGANIZATIONS_READ],
  },
  {
    id: "organization",
    title: "Organization",
    description: "Users, departments, teams, and workspace structure.",
    href: "/analytics/organization",
    enabled: true,
    readPermissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.DEPARTMENTS_READ,
      PERMISSIONS.TEAMS_READ,
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    description: "Document corpus, ingestion, and query activity.",
    href: "/analytics/knowledge",
    enabled: true,
    readPermissions: [PERMISSIONS.DOCUMENTS_READ],
  },
  {
    id: "ai-employees",
    title: "AI Employees",
    description: "Agent roster, chat sessions, and utilization.",
    href: "/analytics/ai-employees",
    enabled: true,
    readPermissions: [PERMISSIONS.EMPLOYEES_READ],
  },
  {
    id: "agent-teams",
    title: "Agent Teams",
    description: "Multi-agent task runs and team performance.",
    href: "/analytics/agent-teams",
    enabled: true,
    readPermissions: [PERMISSIONS.AGENT_TEAMS_READ],
  },
  {
    id: "workflows",
    title: "Workflows",
    description: "Pipeline executions, success rates, and throughput.",
    href: "/analytics/workflows",
    enabled: true,
    readPermissions: [PERMISSIONS.WORKFLOWS_READ],
  },
  {
    id: "research",
    title: "Research",
    description: "Research projects, reports, and run activity.",
    href: "/analytics/research",
    enabled: true,
    readPermissions: [PERMISSIONS.RESEARCH_PROJECTS_READ],
  },
  {
    id: "browser-automation",
    title: "Browser Automation",
    description: "Profiles, tasks, and execution metrics.",
    href: "/analytics/browser-automation",
    enabled: true,
    readPermissions: [
      PERMISSIONS.BROWSER_PROFILES_READ,
      PERMISSIONS.BROWSER_TASKS_READ,
    ],
  },
  {
    id: "reports",
    title: "Reports",
    description: "Research report outcomes and export activity.",
    href: "/analytics/reports",
    enabled: true,
    readPermissions: [PERMISSIONS.RESEARCH_PROJECTS_READ],
  },
];

export const analyticsNavIcons: Record<AnalyticsNavSectionId, LucideIcon> = {
  executive: LayoutDashboard,
  organization: Building2,
  knowledge: BookOpen,
  "ai-employees": Users,
  "agent-teams": Network,
  workflows: GitBranch,
  research: Search,
  "browser-automation": Globe,
  reports: FileText,
};

export const analyticsNavAccents: Record<AnalyticsNavSectionId, DashboardAccent> = {
  executive: "emerald",
  organization: "neutral",
  knowledge: "purple",
  "ai-employees": "emerald",
  "agent-teams": "blue",
  workflows: "purple",
  research: "purple",
  "browser-automation": "blue",
  reports: "gold",
};

export function formatAnalyticsValue(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function buildExecutiveKpis(overview?: DashboardOverview | null): AnalyticsKpiItem[] {
  if (!overview) {
    return [
      { label: "Users", value: "—", detail: "Organization members", accent: "blue" },
      { label: "AI Employees", value: "—", detail: "Configured agents", accent: "emerald" },
      { label: "Workflows", value: "—", detail: "Automation pipelines", accent: "purple" },
      { label: "Research Projects", value: "—", detail: "Research hub", accent: "gold" },
    ];
  }

  return [
    {
      label: "Users",
      value: formatAnalyticsValue(overview.total_users),
      detail: "Organization members",
      accent: "blue",
    },
    {
      label: "AI Employees",
      value: formatAnalyticsValue(overview.total_ai_employees),
      detail: "Configured agents",
      accent: "emerald",
    },
    {
      label: "Workflows",
      value: formatAnalyticsValue(overview.total_workflows),
      detail: "Automation pipelines",
      accent: "purple",
    },
    {
      label: "Research Projects",
      value: formatAnalyticsValue(overview.total_research_projects),
      detail: "Research hub portfolio",
      accent: "gold",
    },
  ];
}

export function buildExecutivePlatformMetrics(
  overview?: DashboardOverview | null,
): AnalyticsChartSegment[] {
  if (!overview) return [];

  return [
    {
      key: "documents",
      label: "Documents",
      value: overview.total_documents,
      accent: "purple",
    },
    {
      key: "agent-tasks",
      label: "Agent Tasks",
      value: overview.total_agent_tasks,
      accent: "blue",
    },
    {
      key: "workflows",
      label: "Workflows",
      value: overview.total_workflows,
      accent: "purple",
    },
    {
      key: "research",
      label: "Research Projects",
      value: overview.total_research_projects,
      accent: "gold",
    },
    {
      key: "browser",
      label: "Browser Tasks",
      value: overview.total_browser_tasks,
      accent: "blue",
    },
    {
      key: "support",
      label: "Support Tickets",
      value: overview.total_support_tickets,
      accent: "emerald",
    },
    {
      key: "voice",
      label: "Voice Sessions",
      value: overview.total_voice_sessions,
      accent: "blue",
    },
    {
      key: "omnichannel",
      label: "Omnichannel",
      value: overview.total_omnichannel_conversations,
      accent: "purple",
    },
  ];
}

export function buildExecutiveHeroStats(snapshot: ExecutiveAnalyticsSnapshot) {
  const overview = snapshot.overview;
  return [
    {
      label: "Users",
      value: formatAnalyticsValue(overview?.total_users),
    },
    {
      label: "Workflows",
      value: formatAnalyticsValue(overview?.total_workflows),
    },
    {
      label: "Research runs (7d)",
      value: snapshot.researchAvailable
        ? formatAnalyticsValue(snapshot.research?.recent_runs_7d)
        : snapshot.researchAccessDenied
          ? "Restricted"
          : "—",
    },
    {
      label: "Browser runs (7d)",
      value: snapshot.browserAvailable
        ? formatAnalyticsValue(snapshot.browser?.recent_executions_7d)
        : snapshot.browserAccessDenied
          ? "Restricted"
          : "—",
    },
  ];
}

export function buildResearchKpis(analytics?: ResearchAnalytics | null): AnalyticsKpiItem[] {
  if (!analytics) {
    return [
      { label: "Total projects", value: "—", detail: "Across your organization", accent: "purple" },
      { label: "Active projects", value: "—", detail: "Currently in progress", accent: "emerald" },
      { label: "Reports completed", value: "—", detail: "Finished research outputs", accent: "blue" },
      { label: "Runs (7 days)", value: "—", detail: "Recent research executions", accent: "gold" },
    ];
  }

  return [
    {
      label: "Total projects",
      value: formatAnalyticsValue(analytics.total_projects),
      detail: "Across your organization",
      accent: "purple",
    },
    {
      label: "Active projects",
      value: formatAnalyticsValue(analytics.active_projects),
      detail: `${analytics.projects_by_status.draft ?? 0} in draft`,
      accent: "emerald",
    },
    {
      label: "Reports completed",
      value: formatAnalyticsValue(analytics.completed_reports),
      detail: `${analytics.total_reports} total reports`,
      accent: "blue",
    },
    {
      label: "Runs (7 days)",
      value: formatAnalyticsValue(analytics.recent_runs_7d),
      detail: "Recent research executions",
      accent: "gold",
    },
  ];
}

export function buildBrowserKpis(analytics?: BrowserAnalytics | null): AnalyticsKpiItem[] {
  if (!analytics) {
    return [
      { label: "Browser profiles", value: "—", detail: "Configured browser identities", accent: "blue" },
      { label: "Automation tasks", value: "—", detail: "Saved automation recipes", accent: "purple" },
      { label: "Executions completed", value: "—", detail: "Successful browser runs", accent: "emerald" },
      { label: "Runs (7 days)", value: "—", detail: "Recent browser executions", accent: "gold" },
    ];
  }

  return [
    {
      label: "Browser profiles",
      value: formatAnalyticsValue(analytics.total_profiles),
      detail: `${analytics.active_profiles} active`,
      accent: "blue",
    },
    {
      label: "Automation tasks",
      value: formatAnalyticsValue(analytics.total_tasks),
      detail: `${analytics.ready_tasks} ready to run`,
      accent: "purple",
    },
    {
      label: "Executions completed",
      value: formatAnalyticsValue(analytics.completed_executions),
      detail: `${analytics.total_executions} total runs`,
      accent: "emerald",
    },
    {
      label: "Runs (7 days)",
      value: formatAnalyticsValue(analytics.recent_executions_7d),
      detail: "Recent browser executions",
      accent: "gold",
    },
  ];
}

const researchStatusAccents: Record<string, DashboardAccent> = {
  draft: "neutral",
  active: "emerald",
  archived: "gold",
};

const researchReportAccents: Record<string, DashboardAccent> = {
  pending: "gold",
  in_progress: "blue",
  completed: "emerald",
  failed: "neutral",
};

const researchTemplateAccents: DashboardAccent[] = ["purple", "blue", "emerald", "gold"];

export function buildResearchStatusChart(
  analytics?: ResearchAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return Object.entries(analytics.projects_by_status).map(([key, value]) => ({
    key,
    label: researchStatusLabels[key as keyof typeof researchStatusLabels] ?? key,
    value,
    accent: researchStatusAccents[key] ?? "neutral",
  }));
}

export function buildResearchTemplateChart(
  analytics?: ResearchAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return Object.entries(analytics.projects_by_template).map(([key, value], index) => ({
    key,
    label: researchTemplateLabels[key as keyof typeof researchTemplateLabels] ?? key,
    value,
    accent: researchTemplateAccents[index % researchTemplateAccents.length],
  }));
}

export function buildResearchReportsChart(
  analytics?: ResearchAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return Object.entries(analytics.reports_by_status).map(([key, value]) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    value,
    accent: researchReportAccents[key] ?? "neutral",
  }));
}

const browserTaskAccents: Record<string, DashboardAccent> = {
  draft: "neutral",
  ready: "emerald",
  archived: "gold",
};

const browserExecutionAccents: Record<string, DashboardAccent> = {
  pending: "gold",
  running: "blue",
  completed: "emerald",
  failed: "neutral",
  cancelled: "purple",
};

export function buildBrowserTaskStatusChart(
  analytics?: BrowserAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return Object.entries(analytics.tasks_by_status).map(([key, value]) => ({
    key,
    label: browserTaskStatusLabels[key as keyof typeof browserTaskStatusLabels] ?? key,
    value,
    accent: browserTaskAccents[key] ?? "neutral",
  }));
}

export function buildBrowserExecutionChart(
  analytics?: BrowserAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return Object.entries(analytics.executions_by_status).map(([key, value]) => ({
    key,
    label:
      browserExecutionStatusLabels[key as keyof typeof browserExecutionStatusLabels] ?? key,
    value,
    accent: browserExecutionAccents[key] ?? "neutral",
  }));
}

export function getAnalyticsSectionByHref(href: string): AnalyticsNavSection | undefined {
  return analyticsNavSections.find((section) => section.href === href);
}

export function getAnalyticsSectionById(
  id: AnalyticsNavSectionId,
): AnalyticsNavSection | undefined {
  return analyticsNavSections.find((section) => section.id === id);
}

const organizationStatusAccents: Record<string, DashboardAccent> = {
  active: "emerald",
  inactive: "neutral",
};

export function buildOrganizationKpis(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "Members", value: "—", detail: "Organization users", accent: "blue" },
      { label: "Departments", value: "—", detail: "Top-level units", accent: "neutral" },
      { label: "Org teams", value: "—", detail: "Teams under departments", accent: "emerald" },
      { label: "Role coverage", value: "—", detail: "Members with roles", accent: "gold" },
    ];
  }

  return [
    {
      label: "Members",
      value: formatAnalyticsValue(metrics.totalUsers),
      detail: `${metrics.activeUsers} active · ${metrics.inactiveUsers} inactive`,
      accent: "blue",
    },
    {
      label: "Departments",
      value: formatAnalyticsValue(metrics.totalDepartments),
      detail: `${metrics.activeDepartments} active departments`,
      accent: "neutral",
    },
    {
      label: "Org teams",
      value: formatAnalyticsValue(metrics.totalTeams),
      detail: `Avg ${metrics.avgTeamsPerDepartment.toFixed(1)} per department`,
      accent: "emerald",
    },
    {
      label: "Role coverage",
      value: `${metrics.roleCoveragePercent}%`,
      detail: `${metrics.usersWithoutRoles} without roles`,
      accent: "gold",
    },
  ];
}

export function buildOrganizationHeroStats(
  metrics?: OrganizationAnalyticsMetrics | null,
) {
  if (!metrics) {
    return [
      { label: "Members", value: "—" },
      { label: "Departments", value: "—" },
      { label: "Roles", value: "—" },
      { label: "New (7d)", value: "—" },
    ];
  }

  return [
    { label: "Members", value: formatAnalyticsValue(metrics.totalUsers) },
    { label: "Departments", value: formatAnalyticsValue(metrics.totalDepartments) },
    { label: "Roles", value: formatAnalyticsValue(metrics.totalRoles) },
    { label: "New (7d)", value: formatAnalyticsValue(metrics.growth.usersLast7Days) },
  ];
}

export function buildOrganizationUserStatusChart(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    {
      key: "active",
      label: "Active",
      value: metrics.usersByStatus.active,
      accent: "emerald",
    },
    {
      key: "inactive",
      label: "Inactive",
      value: metrics.usersByStatus.inactive,
      accent: "neutral",
    },
  ];
}

export function buildOrganizationUsersByRoleChart(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const roleAccents: DashboardAccent[] = ["blue", "purple", "emerald", "gold", "neutral"];

  return Object.entries(metrics.usersByRole)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value], index) => ({
      key,
      label: key.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      value,
      accent: roleAccents[index % roleAccents.length],
    }));
}

export function buildOrganizationDepartmentStatusChart(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.departmentsByStatus).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    accent: organizationStatusAccents[key] ?? "neutral",
  }));
}

export function buildOrganizationTeamsByDepartmentChart(
  metrics?: OrganizationAnalyticsMetrics | null,
  departmentNames?: Map<string, string>,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const accents: DashboardAccent[] = ["blue", "purple", "emerald", "gold", "neutral"];

  return Object.entries(metrics.teamsByDepartment)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
    .map(([departmentId, value], index) => ({
      key: departmentId,
      label: departmentNames?.get(departmentId) ?? "Department",
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildOrganizationWorkspaceChart(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const { workspaceResources } = metrics;

  return [
    { key: "users", label: "Users", value: workspaceResources.users, accent: "blue" },
    {
      key: "departments",
      label: "Departments",
      value: workspaceResources.departments,
      accent: "neutral",
    },
    { key: "teams", label: "Teams", value: workspaceResources.teams, accent: "emerald" },
    { key: "roles", label: "Roles", value: workspaceResources.roles, accent: "purple" },
    {
      key: "permissions",
      label: "Permissions",
      value: workspaceResources.permissions,
      accent: "gold",
    },
  ];
}

export function buildOrganizationGrowthChart(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const { growth } = metrics;

  return [
    { key: "7d", label: "Last 7 days", value: growth.usersLast7Days, accent: "emerald" },
    { key: "30d", label: "Last 30 days", value: growth.usersLast30Days, accent: "blue" },
    { key: "90d", label: "Last 90 days", value: growth.usersLast90Days, accent: "purple" },
  ];
}

export function buildOrganizationInsights(
  metrics?: OrganizationAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `org-insight-${index}`,
    text,
  }));
}

const documentStatusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const documentStatusAccents: Record<string, DashboardAccent> = {
  pending: "gold",
  processing: "blue",
  ready: "emerald",
  failed: "neutral",
};

export function buildKnowledgeKpis(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "Documents", value: "—", detail: "Total corpus size", accent: "purple" },
      { label: "Ready", value: "—", detail: "Indexed documents", accent: "emerald" },
      { label: "In pipeline", value: "—", detail: "Pending or processing", accent: "blue" },
      { label: "Storage", value: "—", detail: "Total file size", accent: "gold" },
    ];
  }

  return [
    {
      label: "Documents",
      value: formatAnalyticsValue(metrics.totalDocuments),
      detail: `${metrics.readyDocuments} ready · ${metrics.failedDocuments} failed`,
      accent: "purple",
    },
    {
      label: "Ready",
      value: formatAnalyticsValue(metrics.readyDocuments),
      detail: `${metrics.ingestionSuccessRate}% ingestion success`,
      accent: "emerald",
    },
    {
      label: "In pipeline",
      value: formatAnalyticsValue(metrics.inPipelineDocuments),
      detail: `${metrics.pendingDocuments} pending · ${metrics.processingDocuments} processing`,
      accent: "blue",
    },
    {
      label: "Storage",
      value: metrics.totalStorageLabel,
      detail: `${formatAnalyticsValue(metrics.totalChunks)} chunks · ${formatAnalyticsValue(metrics.totalPages)} pages`,
      accent: "gold",
    },
  ];
}

export function buildKnowledgeHeroStats(metrics?: KnowledgeAnalyticsMetrics | null) {
  if (!metrics) {
    return [
      { label: "Documents", value: "—" },
      { label: "Ready", value: "—" },
      { label: "Embedded", value: "—" },
      { label: "Uploads (7d)", value: "—" },
    ];
  }

  return [
    { label: "Documents", value: formatAnalyticsValue(metrics.totalDocuments) },
    { label: "Ready", value: formatAnalyticsValue(metrics.readyDocuments) },
    {
      label: "Embedded",
      value: `${metrics.embeddedCoveragePercent}%`,
    },
    { label: "Uploads (7d)", value: formatAnalyticsValue(metrics.uploadsLast7Days) },
  ];
}

export function buildKnowledgeStatusChart(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.documentsByStatus)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      label: documentStatusLabels[key] ?? key,
      value,
      accent: documentStatusAccents[key] ?? "neutral",
    }));
}

export function buildKnowledgeTypeChart(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const accents: DashboardAccent[] = ["purple", "blue", "emerald", "gold", "neutral"];

  return Object.entries(metrics.documentsByType)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildKnowledgeStorageChart(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.storageByStatus)
    .filter(([, bytes]) => bytes > 0)
    .map(([key, bytes]) => ({
      key,
      label: documentStatusLabels[key] ?? key,
      value: Math.max(1, Math.round(bytes / 1024)),
      accent: documentStatusAccents[key] ?? "neutral",
    }));
}

export function buildKnowledgeChunkChart(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const accents: DashboardAccent[] = ["blue", "purple", "emerald", "gold"];

  return Object.entries(metrics.chunkBuckets)
    .filter(([, value]) => value > 0)
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildKnowledgePipelineChart(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    {
      key: "pending",
      label: "Pending",
      value: metrics.pendingDocuments,
      accent: "gold",
    },
    {
      key: "processing",
      label: "Processing",
      value: metrics.processingDocuments,
      accent: "blue",
    },
    {
      key: "ready",
      label: "Ready",
      value: metrics.readyDocuments,
      accent: "emerald",
    },
    {
      key: "failed",
      label: "Failed",
      value: metrics.failedDocuments,
      accent: "neutral",
    },
  ];
}

export function buildKnowledgeInsights(
  metrics?: KnowledgeAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `knowledge-insight-${index}`,
    text,
  }));
}

export function formatKnowledgeSecondaryMetrics(
  metrics?: KnowledgeAnalyticsMetrics | null,
): { label: string; value: string }[] {
  if (!metrics) return [];

  return [
    {
      label: "Embedded coverage",
      value: `${metrics.embeddedCoveragePercent}%`,
    },
    {
      label: "Avg chunks (ready)",
      value:
        metrics.avgChunksPerReadyDoc != null
          ? metrics.avgChunksPerReadyDoc.toFixed(1)
          : "—",
    },
    {
      label: "Avg file size",
      value: metrics.avgFileSizeLabel,
    },
    {
      label: "Avg time to ready",
      value:
        metrics.avgTimeToReadyHours != null
          ? `${metrics.avgTimeToReadyHours.toFixed(1)}h`
          : "—",
    },
  ];
}

const agentTaskStatusAccents: Record<string, DashboardAccent> = {
  pending: "gold",
  in_progress: "blue",
  completed: "emerald",
  failed: "neutral",
  cancelled: "purple",
};

const workflowStatusAccents: Record<string, DashboardAccent> = {
  draft: "neutral",
  active: "emerald",
  archived: "gold",
};

const workflowExecutionAccents: Record<string, DashboardAccent> = {
  pending: "gold",
  in_progress: "blue",
  completed: "emerald",
  failed: "neutral",
  cancelled: "purple",
};

const employeeStatusAccents: Record<string, DashboardAccent> = {
  active: "emerald",
  inactive: "neutral",
};

export function buildAgentTeamsKpis(
  metrics?: AgentTeamsAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "Agent teams", value: "—", detail: "Configured teams", accent: "blue" },
      { label: "Active teams", value: "—", detail: "Currently enabled", accent: "emerald" },
      { label: "Total tasks", value: "—", detail: "Submitted agent tasks", accent: "purple" },
      { label: "Completion rate", value: "—", detail: "Among finished tasks", accent: "gold" },
    ];
  }

  return [
    {
      label: "Agent teams",
      value: formatAnalyticsValue(metrics.totalTeams),
      detail: `${metrics.activeTeams} active · ${metrics.inactiveTeams} inactive`,
      accent: "blue",
    },
    {
      label: "Team members",
      value: formatAnalyticsValue(metrics.teamsWithMembers),
      detail: `Avg ${metrics.avgMembersPerTeam.toFixed(1)} per team`,
      accent: "emerald",
    },
    {
      label: "Total tasks",
      value: formatAnalyticsValue(metrics.totalTasks),
      detail: `${metrics.completedTasks} completed · ${metrics.failedTasks} failed`,
      accent: "purple",
    },
    {
      label: "Completion rate",
      value: `${metrics.taskCompletionRate}%`,
      detail: `${metrics.tasksLast7Days} new tasks (7d)`,
      accent: "gold",
    },
  ];
}

export function buildAgentTeamsHeroStats(
  metrics?: AgentTeamsAnalyticsMetrics | null,
) {
  if (!metrics) {
    return [
      { label: "Teams", value: "—" },
      { label: "Tasks", value: "—" },
      { label: "Completed", value: "—" },
      { label: "New (7d)", value: "—" },
    ];
  }

  return [
    { label: "Teams", value: formatAnalyticsValue(metrics.totalTeams) },
    { label: "Tasks", value: formatAnalyticsValue(metrics.totalTasks) },
    { label: "Completed", value: formatAnalyticsValue(metrics.completedTasks) },
    { label: "New (7d)", value: formatAnalyticsValue(metrics.tasksLast7Days) },
  ];
}

export function buildAgentTeamsStatusChart(
  metrics?: AgentTeamsAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.tasksByStatus).map(([key, value]) => ({
    key,
    label: taskStatusLabels[key as keyof typeof taskStatusLabels] ?? key,
    value,
    accent: agentTaskStatusAccents[key] ?? "neutral",
  }));
}

export function buildAgentTeamsActivityChart(
  metrics?: AgentTeamsAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    { key: "7d", label: "Last 7 days", value: metrics.tasksLast7Days, accent: "emerald" },
    { key: "30d", label: "Last 30 days", value: metrics.tasksLast30Days, accent: "blue" },
    {
      key: "completed",
      label: "Completed",
      value: metrics.completedTasks,
      accent: "purple",
    },
    { key: "failed", label: "Failed", value: metrics.failedTasks, accent: "neutral" },
  ];
}

export function buildAgentTeamsByTeamChart(
  metrics?: AgentTeamsAnalyticsMetrics | null,
  teamNames?: Map<string, string>,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const accents: DashboardAccent[] = ["blue", "purple", "emerald", "gold", "neutral"];

  return Object.entries(metrics.tasksByTeam)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
    .map(([teamId, value], index) => ({
      key: teamId,
      label: teamNames?.get(teamId) ?? "Team",
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildAgentTeamsInsights(
  metrics?: AgentTeamsAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `agent-teams-insight-${index}`,
    text,
  }));
}

export function buildWorkflowsKpis(
  metrics?: WorkflowAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "Workflows", value: "—", detail: "Configured pipelines", accent: "purple" },
      { label: "Active", value: "—", detail: "Published workflows", accent: "emerald" },
      { label: "Executions", value: "—", detail: "Total pipeline runs", accent: "blue" },
      { label: "Success rate", value: "—", detail: "Among finished runs", accent: "gold" },
    ];
  }

  return [
    {
      label: "Workflows",
      value: formatAnalyticsValue(metrics.totalWorkflows),
      detail: `${metrics.activeWorkflows} active · ${metrics.draftWorkflows} draft`,
      accent: "purple",
    },
    {
      label: "Pipeline steps",
      value: formatAnalyticsValue(metrics.totalSteps),
      detail: `Avg ${metrics.avgStepsPerWorkflow.toFixed(1)} per workflow`,
      accent: "emerald",
    },
    {
      label: "Executions",
      value: formatAnalyticsValue(metrics.totalExecutions),
      detail: `${metrics.completedExecutions} completed · ${metrics.failedExecutions} failed`,
      accent: "blue",
    },
    {
      label: "Success rate",
      value: `${metrics.executionSuccessRate}%`,
      detail: `${metrics.executionsLast7Days} runs (7d)`,
      accent: "gold",
    },
  ];
}

export function buildWorkflowsHeroStats(
  metrics?: WorkflowAnalyticsMetrics | null,
) {
  if (!metrics) {
    return [
      { label: "Workflows", value: "—" },
      { label: "Executions", value: "—" },
      { label: "Completed", value: "—" },
      { label: "Runs (7d)", value: "—" },
    ];
  }

  return [
    { label: "Workflows", value: formatAnalyticsValue(metrics.totalWorkflows) },
    { label: "Executions", value: formatAnalyticsValue(metrics.totalExecutions) },
    { label: "Completed", value: formatAnalyticsValue(metrics.completedExecutions) },
    { label: "Runs (7d)", value: formatAnalyticsValue(metrics.executionsLast7Days) },
  ];
}

export function buildWorkflowsStatusChart(
  metrics?: WorkflowAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.workflowsByStatus).map(([key, value]) => ({
    key,
    label: workflowStatusLabels[key as keyof typeof workflowStatusLabels] ?? key,
    value,
    accent: workflowStatusAccents[key] ?? "neutral",
  }));
}

export function buildWorkflowExecutionsChart(
  metrics?: WorkflowAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.executionsByStatus).map(([key, value]) => ({
    key,
    label: executionStatusLabels[key as keyof typeof executionStatusLabels] ?? key,
    value,
    accent: workflowExecutionAccents[key] ?? "neutral",
  }));
}

export function buildWorkflowsActivityChart(
  metrics?: WorkflowAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    {
      key: "7d",
      label: "Last 7 days",
      value: metrics.executionsLast7Days,
      accent: "emerald",
    },
    {
      key: "30d",
      label: "Last 30 days",
      value: metrics.executionsLast30Days,
      accent: "blue",
    },
    {
      key: "completed",
      label: "Completed",
      value: metrics.completedExecutions,
      accent: "purple",
    },
    {
      key: "failed",
      label: "Failed",
      value: metrics.failedExecutions,
      accent: "neutral",
    },
  ];
}

export function buildWorkflowsInsights(
  metrics?: WorkflowAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `workflows-insight-${index}`,
    text,
  }));
}

export function formatWorkflowSecondaryMetrics(
  metrics?: WorkflowAnalyticsMetrics | null,
): { label: string; value: string }[] {
  if (!metrics) return [];

  return [
    {
      label: "Draft workflows",
      value: formatAnalyticsValue(metrics.draftWorkflows),
    },
    {
      label: "Archived workflows",
      value: formatAnalyticsValue(metrics.archivedWorkflows),
    },
    {
      label: "In progress runs",
      value: formatAnalyticsValue(metrics.inProgressExecutions),
    },
    {
      label: "Avg run duration",
      value:
        metrics.avgExecutionDurationHours != null
          ? `${metrics.avgExecutionDurationHours.toFixed(1)}h`
          : "—",
    },
  ];
}

export function buildAIEmployeesKpis(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "AI employees", value: "—", detail: "Configured agents", accent: "emerald" },
      { label: "Active", value: "—", detail: "Currently enabled", accent: "blue" },
      { label: "Conversations", value: "—", detail: "Chat sessions", accent: "purple" },
      { label: "Knowledge coverage", value: "—", detail: "Agents with documents", accent: "gold" },
    ];
  }

  return [
    {
      label: "AI employees",
      value: formatAnalyticsValue(metrics.totalEmployees),
      detail: `${metrics.activeEmployees} active · ${metrics.inactiveEmployees} inactive`,
      accent: "emerald",
    },
    {
      label: "Conversations",
      value: formatAnalyticsValue(metrics.totalConversations),
      detail: `${metrics.conversationsLast7Days} new (7d)`,
      accent: "blue",
    },
    {
      label: "Knowledge coverage",
      value: `${metrics.knowledgeCoveragePercent}%`,
      detail: `${metrics.employeesWithKnowledge} with documents`,
      accent: "purple",
    },
    {
      label: "Tool coverage",
      value: `${metrics.toolCoveragePercent}%`,
      detail: `${metrics.employeesWithTools} with enabled tools`,
      accent: "gold",
    },
  ];
}

export function buildAIEmployeesHeroStats(
  metrics?: AIEmployeeAnalyticsMetrics | null,
) {
  if (!metrics) {
    return [
      { label: "Agents", value: "—" },
      { label: "Active", value: "—" },
      { label: "Conversations", value: "—" },
      { label: "Knowledge", value: "—" },
    ];
  }

  return [
    { label: "Agents", value: formatAnalyticsValue(metrics.totalEmployees) },
    { label: "Active", value: formatAnalyticsValue(metrics.activeEmployees) },
    { label: "Conversations", value: formatAnalyticsValue(metrics.totalConversations) },
    {
      label: "Knowledge",
      value: `${metrics.knowledgeCoveragePercent}%`,
    },
  ];
}

export function buildAIEmployeesStatusChart(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.employeesByStatus).map(([key, value]) => ({
    key,
    label: employeeStatusLabels[key as keyof typeof employeeStatusLabels] ?? key,
    value,
    accent: employeeStatusAccents[key] ?? "neutral",
  }));
}

export function buildAIEmployeesRoleChart(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  const accents: DashboardAccent[] = ["emerald", "blue", "purple", "gold", "neutral"];

  return Object.entries(metrics.employeesByRole)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildAIEmployeesCapabilityChart(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    {
      key: "knowledge",
      label: "With knowledge",
      value: metrics.employeesWithKnowledge,
      accent: "purple",
    },
    {
      key: "tools",
      label: "With tools",
      value: metrics.employeesWithTools,
      accent: "blue",
    },
    {
      key: "inactive",
      label: "Inactive",
      value: metrics.inactiveEmployees,
      accent: "neutral",
    },
    {
      key: "conversations",
      label: "With chats",
      value: metrics.employeeRows.filter((row) => row.conversationCount > 0).length,
      accent: "emerald",
    },
  ];
}

export function buildAIEmployeesInsights(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `ai-employees-insight-${index}`,
    text,
  }));
}

export function formatAIEmployeeSecondaryMetrics(
  metrics?: AIEmployeeAnalyticsMetrics | null,
): { label: string; value: string }[] {
  if (!metrics) return [];

  return [
    {
      label: "Avg knowledge docs",
      value: metrics.avgKnowledgePerEmployee.toFixed(1),
    },
    {
      label: "Avg enabled tools",
      value: metrics.avgToolsPerEmployee.toFixed(1),
    },
    {
      label: "Conversations (30d)",
      value: formatAnalyticsValue(metrics.conversationsLast30Days),
    },
    {
      label: "Inactive agents",
      value: formatAnalyticsValue(metrics.inactiveEmployees),
    },
  ];
}

export function buildReportsKpis(
  metrics?: ReportsAnalyticsMetrics | null,
): AnalyticsKpiItem[] {
  if (!metrics) {
    return [
      { label: "Total reports", value: "—", detail: "Research outputs", accent: "gold" },
      { label: "Completed", value: "—", detail: "Finished reports", accent: "emerald" },
      { label: "Failed", value: "—", detail: "Unsuccessful runs", accent: "neutral" },
      { label: "Completion rate", value: "—", detail: "Among finished runs", accent: "blue" },
    ];
  }

  return [
    {
      label: "Total reports",
      value: formatAnalyticsValue(metrics.totalReports),
      detail: `${metrics.researchProjectCount} research projects`,
      accent: "gold",
    },
    {
      label: "Completed",
      value: formatAnalyticsValue(metrics.completedReports),
      detail: `${metrics.inProgressReports} in progress`,
      accent: "emerald",
    },
    {
      label: "Failed",
      value: formatAnalyticsValue(metrics.failedReports),
      detail: `${metrics.pendingReports} pending`,
      accent: "neutral",
    },
    {
      label: "Completion rate",
      value: `${metrics.completionRate}%`,
      detail: `${metrics.reportsLast7Days} new (7d)`,
      accent: "blue",
    },
  ];
}

export function buildReportsHeroStats(metrics?: ReportsAnalyticsMetrics | null) {
  if (!metrics) {
    return [
      { label: "Reports", value: "—" },
      { label: "Completed", value: "—" },
      { label: "Failed", value: "—" },
      { label: "New (7d)", value: "—" },
    ];
  }

  return [
    { label: "Reports", value: formatAnalyticsValue(metrics.totalReports) },
    { label: "Completed", value: formatAnalyticsValue(metrics.completedReports) },
    { label: "Failed", value: formatAnalyticsValue(metrics.failedReports) },
    { label: "New (7d)", value: formatAnalyticsValue(metrics.reportsLast7Days) },
  ];
}

export function buildReportsStatusChart(
  metrics?: ReportsAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return Object.entries(metrics.reportsByStatus).map(([key, value]) => ({
    key,
    label: taskStatusLabels[key as keyof typeof taskStatusLabels] ?? key,
    value,
    accent: agentTaskStatusAccents[key] ?? "neutral",
  }));
}

export function buildReportsActivityChart(
  metrics?: ReportsAnalyticsMetrics | null,
): AnalyticsChartSegment[] {
  if (!metrics) return [];

  return [
    {
      key: "7d",
      label: "Last 7 days",
      value: metrics.reportsLast7Days,
      accent: "emerald",
    },
    {
      key: "30d",
      label: "Last 30 days",
      value: metrics.reportsLast30Days,
      accent: "blue",
    },
    {
      key: "completed",
      label: "Completed",
      value: metrics.completedReports,
      accent: "gold",
    },
    {
      key: "failed",
      label: "Failed",
      value: metrics.failedReports,
      accent: "neutral",
    },
  ];
}

export function buildReportsInsights(
  metrics?: ReportsAnalyticsMetrics | null,
): AnalyticsInsightItem[] {
  if (!metrics) return [];

  return metrics.insights.map((text, index) => ({
    id: `reports-insight-${index}`,
    text,
  }));
}
