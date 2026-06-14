import type { DashboardOverview } from "@/lib/dashboard/types";
import type { BrowserAnalytics } from "@/lib/browser-automation/types";
import type { Department } from "@/lib/departments/types";
import type { Permission } from "@/lib/permissions/types";
import type { Role } from "@/lib/roles/types";
import type { Organization } from "@/lib/settings/types";
import type { Team } from "@/lib/teams/types";
import type { User } from "@/lib/users/types";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import type { DashboardAccent } from "@/lib/dashboard-accents";
import type { AgentTask, AgentTeam, AgentTeamMember } from "@/lib/agent-teams/types";
import type { AIEmployee, AIEmployeeDetail, EmployeeConversation } from "@/lib/ai-employees/types";
import type { Workflow, WorkflowExecution } from "@/lib/workflows/types";
import type { ResearchAnalytics, ResearchProject, ResearchReportSummary } from "@/lib/research-hub/types";

import type { AgentTeamsAnalyticsMetrics } from "./compute/agent-teams";
import type { AIEmployeeAnalyticsMetrics } from "./compute/ai-employees";
import type { KnowledgeAnalyticsMetrics } from "./compute/knowledge";
import type { OrganizationAnalyticsMetrics } from "./compute/organization";
import type { ReportsAnalyticsMetrics } from "./compute/reports";
import type { WorkflowAnalyticsMetrics } from "./compute/workflows";

export interface AnalyticsKpiItem {
  label: string;
  value: string;
  detail: string;
  accent: DashboardAccent;
}

export interface AnalyticsChartSegment {
  key: string;
  label: string;
  value: number;
  accent: DashboardAccent;
}

export interface AnalyticsInsightItem {
  id: string;
  text: string;
}

export interface ExecutiveAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  research: ResearchAnalytics | undefined;
  browser: BrowserAnalytics | undefined;
  researchAccessDenied: boolean;
  browserAccessDenied: boolean;
  researchAvailable: boolean;
  browserAvailable: boolean;
}

export interface OrganizationAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  organization: Organization | undefined;
  users: User[] | undefined;
  departments: Department[] | undefined;
  teams: Team[] | undefined;
  roles: Role[] | undefined;
  permissions: Permission[] | undefined;
  metrics: OrganizationAnalyticsMetrics | null;
  usersAccessDenied: boolean;
  departmentsAccessDenied: boolean;
  teamsAccessDenied: boolean;
  rolesAccessDenied: boolean;
  permissionsAccessDenied: boolean;
  hasPartialAccess: boolean;
}

export interface KnowledgeAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  documents: KnowledgeDocument[] | undefined;
  metrics: KnowledgeAnalyticsMetrics | null;
  accessDenied: boolean;
}

export interface AgentTeamsAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  teams: AgentTeam[] | undefined;
  tasks: AgentTask[] | undefined;
  membersByTeam: Record<string, AgentTeamMember[]>;
  metrics: AgentTeamsAnalyticsMetrics | null;
  teamsAccessDenied: boolean;
  tasksAccessDenied: boolean;
  membersAccessDenied: boolean;
  hasPartialAccess: boolean;
}

export interface WorkflowAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  workflows: Workflow[] | undefined;
  executionsByWorkflow: Record<string, WorkflowExecution[]>;
  teams: AgentTeam[] | undefined;
  metrics: WorkflowAnalyticsMetrics | null;
  workflowsAccessDenied: boolean;
  executionsAccessDenied: boolean;
  teamsAccessDenied: boolean;
  hasPartialAccess: boolean;
}

export interface AIEmployeeAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  employees: AIEmployee[] | undefined;
  details: AIEmployeeDetail[];
  conversationsByEmployee: Record<string, EmployeeConversation[]>;
  metrics: AIEmployeeAnalyticsMetrics | null;
  employeesAccessDenied: boolean;
  detailsAccessDenied: boolean;
  conversationsAccessDenied: boolean;
  hasPartialAccess: boolean;
}

export interface ReportsAnalyticsSnapshot {
  overview: DashboardOverview | undefined;
  reports: ResearchReportSummary[] | undefined;
  projects: ResearchProject[] | undefined;
  researchAnalytics: ResearchAnalytics | undefined;
  metrics: ReportsAnalyticsMetrics | null;
  reportsAccessDenied: boolean;
  projectsAccessDenied: boolean;
  researchAnalyticsAccessDenied: boolean;
  hasPartialAccess: boolean;
}

export type {
  AgentTeamsAnalyticsMetrics,
  AIEmployeeAnalyticsMetrics,
  KnowledgeAnalyticsMetrics,
  OrganizationAnalyticsMetrics,
  ReportsAnalyticsMetrics,
  WorkflowAnalyticsMetrics,
};
