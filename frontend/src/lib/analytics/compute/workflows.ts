import type { AgentTeam } from "@/lib/agent-teams/types";
import type { DashboardOverview } from "@/lib/dashboard/types";
import type { Workflow, WorkflowExecution } from "@/lib/workflows/types";

import {
  average,
  countByField,
  countInLastDays,
  countWhere,
  durationHours,
  percentOf,
} from "./utils";

export interface WorkflowAnalyticsRow {
  workflowId: string;
  workflowName: string;
  status: Workflow["status"];
  isActive: boolean;
  stepCount: number;
  executionCount: number;
  completedExecutions: number;
  agentTeamName: string;
}

export interface WorkflowAnalyticsMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  draftWorkflows: number;
  archivedWorkflows: number;
  totalSteps: number;
  avgStepsPerWorkflow: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  inProgressExecutions: number;
  executionSuccessRate: number;
  avgExecutionDurationHours: number | null;
  workflowsByStatus: Record<string, number>;
  executionsByStatus: Record<string, number>;
  workflowRows: WorkflowAnalyticsRow[];
  recentExecutions: WorkflowExecution[];
  executionsLast7Days: number;
  executionsLast30Days: number;
  insights: string[];
}

export interface WorkflowAnalyticsInput {
  overview?: DashboardOverview | null;
  workflows?: Workflow[] | null;
  executionsByWorkflow?: Record<string, WorkflowExecution[]>;
  teams?: AgentTeam[] | null;
}

function buildInsights(
  metrics: Omit<WorkflowAnalyticsMetrics, "insights">,
): string[] {
  const insights: string[] = [];

  if (metrics.totalWorkflows === 0) {
    return ["Create workflows to start tracking pipeline execution metrics."];
  }

  insights.push(
    `${metrics.activeWorkflows} of ${metrics.totalWorkflows} workflows are active and published.`,
  );

  if (metrics.totalExecutions > 0) {
    insights.push(
      `${metrics.completedExecutions} of ${metrics.totalExecutions} executions completed (${metrics.executionSuccessRate}% success rate).`,
    );
  }

  if (metrics.failedExecutions > 0) {
    insights.push(
      `${metrics.failedExecutions} failed execution${metrics.failedExecutions === 1 ? "" : "s"} may need review.`,
    );
  }

  if (metrics.executionsLast7Days > 0) {
    insights.push(
      `${metrics.executionsLast7Days} workflow run${metrics.executionsLast7Days === 1 ? "" : "s"} in the last 7 days.`,
    );
  }

  if (metrics.avgStepsPerWorkflow > 0) {
    insights.push(
      `Workflows average ${metrics.avgStepsPerWorkflow.toFixed(1)} steps per pipeline.`,
    );
  }

  return insights.slice(0, 4);
}

export function computeWorkflowMetrics(
  input: WorkflowAnalyticsInput,
): WorkflowAnalyticsMetrics | null {
  const overview = input.overview;
  if (!overview) return null;

  const workflows = input.workflows ?? [];
  const executionsByWorkflow = input.executionsByWorkflow ?? {};
  const teams = input.teams ?? [];
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  const allExecutions = Object.values(executionsByWorkflow).flat();

  const activeWorkflows = countWhere(
    workflows,
    (workflow) => workflow.status === "active" && workflow.is_active,
  );
  const draftWorkflows = countWhere(workflows, (workflow) => workflow.status === "draft");
  const archivedWorkflows = countWhere(
    workflows,
    (workflow) => workflow.status === "archived",
  );

  const stepCounts = workflows.map((workflow) => workflow.steps.length);
  const totalSteps = stepCounts.reduce((sum, count) => sum + count, 0);
  const avgStepsPerWorkflow = average(stepCounts) ?? 0;

  const completedExecutions = countWhere(
    allExecutions,
    (execution) => execution.status === "completed",
  );
  const failedExecutions = countWhere(
    allExecutions,
    (execution) => execution.status === "failed",
  );
  const inProgressExecutions = countWhere(
    allExecutions,
    (execution) => execution.status === "in_progress",
  );

  const finishedExecutions = completedExecutions + failedExecutions;
  const executionSuccessRate = percentOf(completedExecutions, finishedExecutions);

  const durations = allExecutions
    .map((execution) => durationHours(execution.started_at, execution.completed_at))
    .filter((value): value is number => value != null);
  const avgExecutionDurationHours = average(durations);

  const workflowsByStatus = countByField(workflows, (workflow) => workflow.status);
  const executionsByStatus = countByField(allExecutions, (execution) => execution.status);

  const workflowRows: WorkflowAnalyticsRow[] = workflows
    .map((workflow) => {
      const executions = executionsByWorkflow[workflow.id] ?? [];
      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: workflow.status,
        isActive: workflow.is_active,
        stepCount: workflow.steps.length,
        executionCount: executions.length,
        completedExecutions: countWhere(
          executions,
          (execution) => execution.status === "completed",
        ),
        agentTeamName: teamNameById.get(workflow.agent_team_id) ?? "Unknown team",
      };
    })
    .sort((left, right) => right.executionCount - left.executionCount);

  const recentExecutions = [...allExecutions]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 8);

  const baseMetrics = {
    totalWorkflows: workflows.length || overview.total_workflows,
    activeWorkflows,
    draftWorkflows,
    archivedWorkflows,
    totalSteps,
    avgStepsPerWorkflow,
    totalExecutions: allExecutions.length,
    completedExecutions,
    failedExecutions,
    inProgressExecutions,
    executionSuccessRate,
    avgExecutionDurationHours,
    workflowsByStatus,
    executionsByStatus,
    workflowRows,
    recentExecutions,
    executionsLast7Days: countInLastDays(allExecutions, 7),
    executionsLast30Days: countInLastDays(allExecutions, 30),
  };

  return {
    ...baseMetrics,
    insights: buildInsights(baseMetrics),
  };
}
