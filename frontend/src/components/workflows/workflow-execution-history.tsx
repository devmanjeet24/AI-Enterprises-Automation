"use client";

import { ChevronDown, ChevronRight, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate } from "@/config/workflows";
import type { WorkflowExecution } from "@/lib/workflows/types";

import { ExecutionStatusBadge } from "./execution-status-badge";
import { WorkflowRunLogs } from "./workflow-run-logs";

interface WorkflowExecutionHistoryProps {
  executions: WorkflowExecution[];
  isLoading?: boolean;
}

export function WorkflowExecutionHistory({
  executions,
  isLoading = false,
}: WorkflowExecutionHistoryProps) {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const sortedRuns = [...executions].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  if (isLoading) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" />
        Loading run history…
      </DashboardCard>
    );
  }

  if (sortedRuns.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Clock className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">
          No run history
        </h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Run this workflow to see execution history and step-by-step logs here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRuns.map((run) => {
        const isExpanded = expandedRunId === run.id;
        const stepLogs = run.agent_task?.executions ?? [];

        return (
          <DashboardCard
            key={run.id}
            variant="panel"
            accent="purple"
            interactive={false}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
              className="flex w-full items-start gap-3 p-5 text-left"
            >
              {isExpanded ? (
                <ChevronDown className="mt-0.5 size-4 shrink-0 text-tertiary" />
              ) : (
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-tertiary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-foreground">
                    {run.agent_task?.title ?? "Workflow run"}
                  </p>
                  <ExecutionStatusBadge status={run.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-tertiary">
                  <span>{formatRelativeDate(run.updated_at)}</span>
                  {run.final_output && (
                    <span className="text-emerald-400">Output available</span>
                  )}
                  {run.error_message && (
                    <span className="text-destructive">Error recorded</span>
                  )}
                  {stepLogs.length > 0 && (
                    <span>{stepLogs.length} step logs</span>
                  )}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-white/[0.06] px-5 pb-5">
                {run.final_output && (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-emerald-400">
                      Final output
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                      {run.final_output}
                    </p>
                  </div>
                )}

                {run.error_message && (
                  <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-destructive">
                      Error
                    </p>
                    <p className="mt-2 text-[13px] text-destructive">
                      {run.error_message}
                    </p>
                  </div>
                )}

                {stepLogs.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
                      Step logs
                    </p>
                    <WorkflowRunLogs executions={stepLogs} />
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    No step logs available for this run.
                  </p>
                )}
              </div>
            )}
          </DashboardCard>
        );
      })}
    </div>
  );
}
