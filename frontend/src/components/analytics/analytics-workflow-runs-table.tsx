"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";

import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { formatDateTime } from "@/config/research-hub";
import type { WorkflowExecution } from "@/lib/workflows/types";

interface AnalyticsWorkflowRunsTableProps {
  executions: WorkflowExecution[];
  workflowNames?: Map<string, string>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsWorkflowRunsTable({
  executions,
  workflowNames,
  isLoading = false,
  emptyMessage = "Recent workflow runs will appear here.",
}: AnalyticsWorkflowRunsTableProps) {
  return (
    <DashboardCard variant="panel" accent="purple" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Recent runs"
        subtitle="Latest workflow execution outcomes"
        accent="purple"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Workflow</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Started</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3].map((index) => (
                <tr key={index} className="border-b border-white/[0.04]">
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <GitBranch className="mx-auto size-6 text-tertiary" />
                  <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              executions.map((execution) => (
                <tr
                  key={execution.id}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/workflows/${execution.workflow_id}`}
                      className="font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {workflowNames?.get(execution.workflow_id) ?? "Workflow"}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <TaskStatusBadge status={execution.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {execution.started_at
                      ? formatDateTime(execution.started_at)
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {formatDateTime(execution.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
