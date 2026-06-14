"use client";

import { useQuery } from "@tanstack/react-query";

import { listAgentTeams } from "@/lib/api/agent-teams";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { listWorkflowExecutions, listWorkflows } from "@/lib/api/workflows";
import { computeWorkflowMetrics } from "@/lib/analytics/compute/workflows";
import { fetchOptional } from "@/lib/analytics/fetch-optional";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { WorkflowAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useWorkflowsAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.workflows(),
    queryFn: async (): Promise<WorkflowAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      const [workflowsResult, teamsResult] = await Promise.all([
        fetchOptional(() => listWorkflows(token!)),
        fetchOptional(() => listAgentTeams(token!)),
      ]);

      const workflowsAccessDenied = workflowsResult.accessDenied;
      const teamsAccessDenied = teamsResult.accessDenied;
      const workflows = workflowsResult.data ?? [];

      let executionsAccessDenied = false;
      const executionsByWorkflow: WorkflowAnalyticsSnapshot["executionsByWorkflow"] =
        {};

      if (!workflowsAccessDenied && workflows.length > 0) {
        const executionResults = await Promise.all(
          workflows.map((workflow) =>
            fetchOptional(() => listWorkflowExecutions(token!, workflow.id)),
          ),
        );

        executionsAccessDenied = executionResults.some(
          (result) => result.accessDenied,
        );

        workflows.forEach((workflow, index) => {
          if (executionResults[index]?.data) {
            executionsByWorkflow[workflow.id] = executionResults[index].data!;
          }
        });
      }

      const hasPartialAccess =
        !workflowsAccessDenied ||
        !executionsAccessDenied ||
        !teamsAccessDenied;

      const metrics = computeWorkflowMetrics({
        overview,
        workflows: workflowsResult.data,
        executionsByWorkflow,
        teams: teamsResult.data,
      });

      return {
        overview,
        workflows: workflowsResult.data,
        executionsByWorkflow,
        teams: teamsResult.data,
        metrics,
        workflowsAccessDenied,
        executionsAccessDenied,
        teamsAccessDenied,
        hasPartialAccess,
      };
    },
    enabled: Boolean(token),
  });
}
