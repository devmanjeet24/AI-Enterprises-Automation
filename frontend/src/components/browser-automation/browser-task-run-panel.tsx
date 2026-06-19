"use client";

import { AlertCircle, Globe, Loader2, Play } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useRunBrowserTask } from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatExecutionErrorMessage, getExecutionFailedStep } from "@/lib/browser-automation/execution-helpers";
import {
  canRunBrowserTask,
  getBrowserRunBlockedMessage,
} from "@/lib/browser-automation/run-messages";
import type {
  BrowserTaskDetail,
  BrowserTaskExecution,
} from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface BrowserTaskRunPanelProps {
  task: BrowserTaskDetail;
  canExecute?: boolean;
  canWrite?: boolean;
  onRunComplete?: (execution: BrowserTaskExecution) => void;
}

export function BrowserTaskRunPanel({
  task,
  canExecute = true,
  canWrite = true,
  onRunComplete,
}: BrowserTaskRunPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const runMutation = useRunBrowserTask(task.id);
  const [lastRunResult, setLastRunResult] = useState<BrowserTaskExecution | null>(null);

  const canRun = canRunBrowserTask(task, canExecute);
  const blockedMessage = getBrowserRunBlockedMessage(task, {
    canExecute,
    canWrite,
  });

  const handleRun = async () => {
    setLastRunResult(null);
    try {
      const execution = await runMutation.mutateAsync();
      setLastRunResult(execution);
      onRunComplete?.(execution);

      if (execution.status === "completed") {
        toast.success("Browser task completed successfully.");
        return;
      }

      if (execution.status === "failed") {
        toast.error(formatExecutionErrorMessage(execution));
        return;
      }

      toast.success("Browser task run started.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to run browser task."));
    }
  };

  const isRunning = runMutation.isPending;

  return (
    <div className="space-y-4">
      {!canRun && (
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
          <p className="text-[14px] font-medium text-foreground">Run unavailable</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{blockedMessage}</p>
        </DashboardCard>
      )}

      {lastRunResult?.status === "failed" && (
        <DashboardCard
          variant="panel"
          accent="blue"
          interactive={false}
          className="border-destructive/20 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-[14px] font-medium text-foreground">Run failed</p>
              <p className="mt-1 text-[13px] text-destructive">
                {formatExecutionErrorMessage(lastRunResult)}
              </p>
              {getExecutionFailedStep(lastRunResult) && (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Open execution details for the step timeline and failure screenshot.
                </p>
              )}
            </div>
          </div>
        </DashboardCard>
      )}

      {lastRunResult?.status === "completed" && (
        <DashboardCard
          variant="panel"
          accent="blue"
          interactive={false}
          className="border-emerald-400/20 p-5"
        >
          <div className="flex items-start gap-3">
            <Globe className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-[14px] font-medium text-foreground">Run completed</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Execution finished successfully. View logs and results in the History tab.
              </p>
            </div>
          </div>
        </DashboardCard>
      )}

      {lastRunResult &&
        (lastRunResult.status === "pending" || lastRunResult.status === "running") && (
          <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-brand" />
              <div>
                <p className="text-[14px] font-medium text-foreground">Run in progress</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Browser automation is executing. History will update automatically.
                </p>
              </div>
            </div>
          </DashboardCard>
        )}

      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <Globe className={cn("size-4", accent.text)} />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Run browser task
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Executes this task using the{" "}
              <span className="text-foreground">{task.profile_name}</span> profile against
              the configured target URL.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="brand"
            size="sm"
            disabled={!canRun || isRunning}
            onClick={handleRun}
          >
            {isRunning ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            {isRunning ? "Running task…" : "Run task"}
          </Button>
          {isRunning && (
            <p className="text-[12px] text-muted-foreground">
              Browser automation is executing…
            </p>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
