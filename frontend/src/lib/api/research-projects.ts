import { apiClient } from "@/lib/api/client";
import type { AgentTaskStatus } from "@/lib/agent-teams/types";
import type {
  CreateResearchProjectInput,
  ListResearchReportsParams,
  ResearchAnalytics,
  ResearchExecutionHistory,
  ResearchProject,
  ResearchProjectStatus,
  ResearchReport,
  ResearchReportSummary,
  ResearchTemplate,
  RunResearchProjectInput,
  UpdateResearchProjectInput,
} from "@/lib/research-hub/types";

const RESEARCH_PROJECTS_BASE = "/api/v1/research-projects";

export function listResearchTemplates(token: string): Promise<ResearchTemplate[]> {
  return apiClient<ResearchTemplate[]>(`${RESEARCH_PROJECTS_BASE}/templates`, {
    method: "GET",
    token,
  });
}

export function getResearchAnalytics(token: string): Promise<ResearchAnalytics> {
  return apiClient<ResearchAnalytics>(`${RESEARCH_PROJECTS_BASE}/analytics`, {
    method: "GET",
    token,
  });
}

export function listResearchReports(
  token: string,
  params?: ListResearchReportsParams,
): Promise<ResearchReportSummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) {
    searchParams.set("project_id", params.project_id);
  }
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  if (params?.limit != null) {
    searchParams.set("limit", String(params.limit));
  }
  const query = searchParams.toString();
  return apiClient<ResearchReportSummary[]>(
    `${RESEARCH_PROJECTS_BASE}/reports${query ? `?${query}` : ""}`,
    { method: "GET", token },
  );
}

export function listResearchProjects(
  token: string,
  status?: ResearchProjectStatus,
): Promise<ResearchProject[]> {
  const query = status ? `?status=${status}` : "";
  return apiClient<ResearchProject[]>(`${RESEARCH_PROJECTS_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function getResearchProject(
  token: string,
  projectId: string,
): Promise<ResearchProject> {
  return apiClient<ResearchProject>(`${RESEARCH_PROJECTS_BASE}/${projectId}`, {
    method: "GET",
    token,
  });
}

export function createResearchProject(
  token: string,
  input: CreateResearchProjectInput,
): Promise<ResearchProject> {
  return apiClient<ResearchProject>(RESEARCH_PROJECTS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateResearchProject(
  token: string,
  projectId: string,
  input: UpdateResearchProjectInput,
): Promise<ResearchProject> {
  return apiClient<ResearchProject>(`${RESEARCH_PROJECTS_BASE}/${projectId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteResearchProject(
  token: string,
  projectId: string,
): Promise<void> {
  return apiClient<void>(`${RESEARCH_PROJECTS_BASE}/${projectId}`, {
    method: "DELETE",
    token,
  });
}

export function runResearchProject(
  token: string,
  projectId: string,
  input: RunResearchProjectInput = {},
): Promise<ResearchReport> {
  return apiClient<ResearchReport>(`${RESEARCH_PROJECTS_BASE}/${projectId}/run`, {
    method: "POST",
    token,
    body: input,
  });
}

export function listProjectResearchReports(
  token: string,
  projectId: string,
): Promise<ResearchReportSummary[]> {
  return apiClient<ResearchReportSummary[]>(
    `${RESEARCH_PROJECTS_BASE}/${projectId}/reports`,
    { method: "GET", token },
  );
}

export function listProjectResearchExecutions(
  token: string,
  projectId: string,
): Promise<ResearchExecutionHistory[]> {
  return apiClient<ResearchExecutionHistory[]>(
    `${RESEARCH_PROJECTS_BASE}/${projectId}/executions`,
    { method: "GET", token },
  );
}

export function getResearchReport(
  token: string,
  projectId: string,
  reportId: string,
): Promise<ResearchReport> {
  return apiClient<ResearchReport>(
    `${RESEARCH_PROJECTS_BASE}/${projectId}/reports/${reportId}`,
    { method: "GET", token },
  );
}

export type { AgentTaskStatus, ListResearchReportsParams };
