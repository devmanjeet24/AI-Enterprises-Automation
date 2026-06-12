"use client";

import { ChevronDown, ChevronRight, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatDuration,
  formatRelativeDate,
} from "@/config/research-hub";
import type { ResearchExecutionHistory } from "@/lib/research-hub/types";

interface ResearchProjectExecutionHistoryProps {
  executions: ResearchExecutionHistory[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function ResearchProjectExecutionHistory({
  executions,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: ResearchProjectExecutionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedExecutions = [...executions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
        Loading execution history…
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-12 text-center"
      >
        <p className="text-[15px] font-medium text-foreground">
          Failed to load execution history
        </p>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          {errorMessage ?? "Could not load execution history."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[13px] font-medium text-brand hover:underline"
          >
            Try again
          </button>
        )}
      </DashboardCard>
    );
  }

  if (sortedExecutions.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Clock className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">
          No execution history
        </h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Run research on this project to see versioned execution history and output
          previews here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedExecutions.map((execution) => {
        const isExpanded = expandedId === execution.id;
        const duration = formatDuration(execution.started_at, execution.completed_at);

        return (
          <DashboardCard
            key={execution.id}
            variant="panel"
            accent="purple"
            interactive={false}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : execution.id)}
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
                    Version {execution.version_number}
                  </p>
                  <TaskStatusBadge status={execution.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-tertiary">
                  <span>{formatRelativeDate(execution.created_at)}</span>
                  {duration && <span>Duration: {duration}</span>}
                  {execution.started_at && (
                    <span>Started {formatDateTime(execution.started_at)}</span>
                  )}
                  {execution.final_output && (
                    <span className="text-emerald-400">Output available</span>
                  )}
                  {execution.error_message && (
                    <span className="text-destructive">Error recorded</span>
                  )}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-white/[0.06] px-5 pb-5">
                {execution.final_output && (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-emerald-400">
                      Final output preview
                    </p>
                    <p className="mt-2 line-clamp-6 text-[13px] leading-relaxed text-foreground">
                      {execution.final_output}
                    </p>
                  </div>
                )}

                {execution.error_message && (
                  <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-destructive">
                      Error
                    </p>
                    <p className="mt-2 text-[13px] text-destructive">
                      {execution.error_message}
                    </p>
                  </div>
                )}

                {!execution.final_output && !execution.error_message && (
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    No output recorded for this execution yet.
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
