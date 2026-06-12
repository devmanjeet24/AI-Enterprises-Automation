import type { AgentTaskStatus } from "@/lib/agent-teams/types";
import type { ResearchProjectStatus } from "@/lib/research-hub/types";

export const researchProjectKeys = {
  all: ["research-projects"] as const,
  lists: () => [...researchProjectKeys.all, "list"] as const,
  list: (status?: ResearchProjectStatus) =>
    [...researchProjectKeys.lists(), { status: status ?? "all" }] as const,
  details: () => [...researchProjectKeys.all, "detail"] as const,
  detail: (id: string) => [...researchProjectKeys.details(), id] as const,
  templates: () => [...researchProjectKeys.all, "templates"] as const,
  analytics: () => [...researchProjectKeys.all, "analytics"] as const,
  reports: () => [...researchProjectKeys.all, "reports"] as const,
  reportList: (params?: {
    project_id?: string;
    status?: AgentTaskStatus;
    limit?: number;
  }) => [...researchProjectKeys.reports(), params ?? {}] as const,
  projectReports: (projectId: string) =>
    [...researchProjectKeys.all, "project-reports", projectId] as const,
  reportDetail: (projectId: string, reportId: string) =>
    [...researchProjectKeys.all, "report-detail", projectId, reportId] as const,
  executions: (projectId: string) =>
    [...researchProjectKeys.all, "executions", projectId] as const,
};
