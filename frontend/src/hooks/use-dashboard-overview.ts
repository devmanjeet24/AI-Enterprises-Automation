"use client";

import { useQuery } from "@tanstack/react-query";

import { listAgentTasks } from "@/lib/api/agent-tasks";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { listDocuments } from "@/lib/api/documents";
import { listEmployees } from "@/lib/api/employees";
import { listWorkflowExecutions, listWorkflows } from "@/lib/api/workflows";
import {
  buildOverviewActivity,
  buildOverviewEmployees,
  buildOverviewKpis,
  overviewKpiPlaceholders,
  buildOverviewQuickStats,
  buildOverviewWorkflows,
  buildPlatformPulse,
  platformPulsePlaceholders,
  countActivityToday,
} from "@/lib/dashboard/overview";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import type {
  DashboardOverview,
  OverviewActivityItem,
  OverviewEmployeeItem,
  OverviewKpiItem,
  OverviewPlatformMetric,
  OverviewQuickStat,
  OverviewWorkflowItem,
} from "@/lib/dashboard/types";

import { useAuthToken } from "./use-auth-token";

export interface OverviewPageData {
  overview: DashboardOverview | undefined;
  kpis: OverviewKpiItem[];
  quickStats: OverviewQuickStat[];
  employees: OverviewEmployeeItem[];
  workflows: OverviewWorkflowItem[];
  activity: OverviewActivityItem[];
  activityTodayCount: number;
  platformPulse: OverviewPlatformMetric[];
  activeEmployeeCount: number;
  runningWorkflowCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

export function useDashboardOverview() {
  const token = useAuthToken();

  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => getDashboardOverview(token!),
    enabled: Boolean(token),
  });
}

export function useOverviewPage(): OverviewPageData {
  const token = useAuthToken();

  const overviewQuery = useDashboardOverview();

  const detailQuery = useQuery({
    queryKey: [...dashboardKeys.all, "details"],
    queryFn: async () => {
      const [employees, workflows, documents, tasks] = await Promise.all([
        listEmployees(token!),
        listWorkflows(token!),
        listDocuments(token!),
        listAgentTasks(token!),
      ]);

      const executionGroups = await Promise.all(
        workflows.map((workflow) => listWorkflowExecutions(token!, workflow.id)),
      );
      const executions = executionGroups.flat();

      return {
        employees,
        workflows,
        documents,
        tasks,
        executions,
      };
    },
    enabled: Boolean(token),
  });

  const overview = overviewQuery.data;
  const details = detailQuery.data;

  const kpis = overview ? buildOverviewKpis(overview) : overviewKpiPlaceholders;
  const quickStats =
    overview && details
      ? buildOverviewQuickStats(
          overview,
          details.employees,
          details.documents,
          details.tasks,
          details.executions,
        )
      : [];
  const employees = details ? buildOverviewEmployees(details.employees) : [];
  const workflows =
    details ? buildOverviewWorkflows(details.workflows, details.executions) : [];
  const activity =
    details
      ? buildOverviewActivity(
          details.tasks,
          details.executions,
          details.documents,
          details.workflows,
        )
      : [];
  const platformPulse =
    overview && details
      ? buildPlatformPulse(overview, details.documents)
      : platformPulsePlaceholders;

  const refetch = async () => {
    await Promise.all([overviewQuery.refetch(), detailQuery.refetch()]);
  };

  return {
    overview,
    kpis,
    quickStats,
    employees,
    workflows,
    activity,
    activityTodayCount: countActivityToday(activity),
    platformPulse,
    activeEmployeeCount: details
      ? details.employees.filter((employee) => employee.status === "active").length
      : 0,
    runningWorkflowCount: workflows.filter(
      (workflow) => workflow.status === "running",
    ).length,
    isLoading: overviewQuery.isLoading || detailQuery.isLoading,
    isError: overviewQuery.isError || detailQuery.isError,
    error: overviewQuery.error ?? detailQuery.error,
    refetch,
  };
}
