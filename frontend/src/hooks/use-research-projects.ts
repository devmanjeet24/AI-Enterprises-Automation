"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAgentTeam } from "@/lib/api/agent-teams";
import {
  createResearchProject,
  deleteResearchProject,
  exportResearchReportMarkdown,
  exportResearchReportPdf,
  getResearchAnalytics,
  getResearchProject,
  getResearchReport,
  listProjectResearchExecutions,
  listProjectResearchReports,
  listResearchProjects,
  listResearchReports,
  listResearchTemplates,
  runResearchProject,
  updateResearchProject,
} from "@/lib/api/research-projects";
import { agentTaskKeys } from "@/lib/agent-teams/query-keys";
import type { AgentTaskStatus } from "@/lib/agent-teams/types";
import { researchProjectKeys } from "@/lib/research-hub/query-keys";
import type {
  CreateResearchProjectInput,
  ListResearchReportsParams,
  ResearchExecutionHistory,
  ResearchProjectDetail,
  ResearchProjectStatus,
  ResearchReportSummary,
  RunResearchProjectInput,
  UpdateResearchProjectInput,
} from "@/lib/research-hub/types";

import { useAuthToken } from "./use-auth-token";

const REPORT_POLL_MS = 3000;

function hasInProgressReport(
  reports: ResearchReportSummary[] | ResearchExecutionHistory[] | undefined,
): boolean {
  return (
    reports?.some(
      (report) => report.status === "pending" || report.status === "in_progress",
    ) ?? false
  );
}

export function useResearchTemplates() {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.templates(),
    queryFn: () => listResearchTemplates(token!),
    enabled: Boolean(token),
  });
}

export function useResearchAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.analytics(),
    queryFn: () => getResearchAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useResearchProjects(status?: ResearchProjectStatus) {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.list(status),
    queryFn: () => listResearchProjects(token!, status),
    enabled: Boolean(token),
  });
}

export function useResearchProject(projectId: string) {
  const token = useAuthToken();

  const projectQuery = useQuery({
    queryKey: researchProjectKeys.detail(projectId),
    queryFn: () => getResearchProject(token!, projectId),
    enabled: Boolean(token) && Boolean(projectId),
  });

  const teamId = projectQuery.data?.agent_team_id;

  const teamQuery = useQuery({
    queryKey: ["agent-teams", "detail", teamId ?? ""],
    queryFn: () => getAgentTeam(token!, teamId!),
    enabled: Boolean(token) && Boolean(teamId),
  });

  const data: ResearchProjectDetail | undefined = projectQuery.data
    ? {
        ...projectQuery.data,
        agent_team_name: teamQuery.data?.name ?? "Loading team…",
      }
    : undefined;

  return {
    data,
    isLoading: projectQuery.isLoading,
    isError: projectQuery.isError || teamQuery.isError,
    error: projectQuery.error ?? teamQuery.error,
    refetch: async () => {
      await Promise.all([projectQuery.refetch(), teamQuery.refetch()]);
    },
  };
}

export function useResearchReports(params?: ListResearchReportsParams) {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.reportList(params),
    queryFn: () => listResearchReports(token!, params),
    enabled: Boolean(token),
  });
}

export function useProjectResearchReports(projectId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.projectReports(projectId),
    queryFn: () => listProjectResearchReports(token!, projectId),
    enabled: Boolean(token) && Boolean(projectId),
    refetchInterval: (query) =>
      hasInProgressReport(query.state.data) ? REPORT_POLL_MS : false,
  });
}

export function useResearchExecutions(projectId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.executions(projectId),
    queryFn: () => listProjectResearchExecutions(token!, projectId),
    enabled: Boolean(token) && Boolean(projectId),
    refetchInterval: (query) =>
      hasInProgressReport(query.state.data) ? REPORT_POLL_MS : false,
  });
}

export function useResearchReport(projectId: string, reportId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: researchProjectKeys.reportDetail(projectId, reportId),
    queryFn: () => getResearchReport(token!, projectId, reportId),
    enabled: Boolean(token) && Boolean(projectId) && Boolean(reportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "in_progress"
        ? REPORT_POLL_MS
        : false;
    },
  });
}

export function useCreateResearchProject() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResearchProjectInput) =>
      createResearchProject(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.analytics() });
    },
  });
}

export function useUpdateResearchProject(projectId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateResearchProjectInput) =>
      updateResearchProject(token!, projectId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(researchProjectKeys.detail(projectId), project);
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.analytics() });
    },
  });
}

export function useDeleteResearchProject() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteResearchProject(token!, projectId),
    onSuccess: (_data, projectId) => {
      queryClient.removeQueries({ queryKey: researchProjectKeys.detail(projectId) });
      queryClient.removeQueries({
        queryKey: researchProjectKeys.projectReports(projectId),
      });
      queryClient.removeQueries({
        queryKey: researchProjectKeys.executions(projectId),
      });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.reports() });
    },
  });
}

export function useRunResearchProject(projectId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RunResearchProjectInput = {}) =>
      runResearchProject(token!, projectId, input),
    onSuccess: (report) => {
      if (report.agent_task) {
        queryClient.setQueryData(
          agentTaskKeys.detail(report.agent_task.id),
          report.agent_task,
        );
      }
      queryClient.invalidateQueries({
        queryKey: researchProjectKeys.projectReports(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: researchProjectKeys.executions(projectId),
      });
      queryClient.setQueryData(
        researchProjectKeys.reportDetail(projectId, report.id),
        report,
      );
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.reports() });
      queryClient.invalidateQueries({ queryKey: researchProjectKeys.analytics() });
    },
  });
}

export function useExportResearchReportMarkdown(projectId: string, reportId: string) {
  const token = useAuthToken();

  return useMutation({
    mutationFn: () => exportResearchReportMarkdown(token!, projectId, reportId),
  });
}

export function useExportResearchReportPdf(projectId: string, reportId: string) {
  const token = useAuthToken();

  return useMutation({
    mutationFn: () => exportResearchReportPdf(token!, projectId, reportId),
  });
}

export type { AgentTaskStatus, ListResearchReportsParams };
