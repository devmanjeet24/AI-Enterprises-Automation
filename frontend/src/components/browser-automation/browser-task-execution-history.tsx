"use client";

import { Clock, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatDuration,
  formatRelativeDate,
} from "@/config/browser-automation";
import type { BrowserTaskExecutionSummary } from "@/lib/browser-automation/types";

import { BrowserExecutionStatusBadge } from "./browser-execution-status-badge";
import { BrowserExecutionViewerModal } from "./browser-execution-viewer-modal";

interface BrowserTaskExecutionHistoryProps {
  executions: BrowserTaskExecutionSummary[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function BrowserTaskExecutionHistory({
  executions,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: BrowserTaskExecutionHistoryProps) {
  const [selectedExecution, setSelectedExecution] =
    useState<BrowserTaskExecutionSummary | null>(null);

  const sortedExecutions = [...executions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (isLoading) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
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
        accent="blue"
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
        accent="blue"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Clock className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">No execution history</h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Run this browser task to see execution history, logs, and results here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedExecutions.map((execution) => {
          const duration = formatDuration(execution.started_at, execution.completed_at);

          return (
            <DashboardCard
              key={execution.id}
              variant="panel"
              accent="blue"
              interactive={false}
              className="overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-medium text-foreground">
                      Execution {execution.id.slice(0, 8)}
                    </p>
                    <BrowserExecutionStatusBadge status={execution.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-tertiary">
                    <span>{formatRelativeDate(execution.created_at)}</span>
                    {duration && <span>Duration: {duration}</span>}
                    {execution.started_at && (
                      <span>Started {formatDateTime(execution.started_at)}</span>
                    )}
                    {execution.completed_at && (
                      <span>Completed {formatDateTime(execution.completed_at)}</span>
                    )}
                    {execution.error_message && (
                      <span className="text-destructive">Error recorded</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedExecution(execution)}
                >
                  <Eye className="size-3.5" />
                  View
                </Button>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      <BrowserExecutionViewerModal
        executionSummary={selectedExecution}
        onClose={() => setSelectedExecution(null)}
      />
    </>
  );
}
