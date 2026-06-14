"use client";

import { Loader2, Play, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useRunWorkflow } from "@/hooks/use-workflows";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { WorkflowDetail, WorkflowExecution } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { ExecutionStatusBadge } from "./execution-status-badge";
import { WorkflowRunLogs } from "./workflow-run-logs";

interface WorkflowExecutionPanelProps {
  workflow: WorkflowDetail;
  executions: WorkflowExecution[];
  executionsLoading?: boolean;
  canWrite?: boolean;
}

export function WorkflowExecutionPanel({
  workflow,
  executions,
  executionsLoading = false,
  canWrite = true,
}: WorkflowExecutionPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const runMutation = useRunWorkflow(workflow.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canRun =
    canWrite &&
    workflow.is_active &&
    workflow.status === "active" &&
    workflow.steps.length > 0;

  const activeRun = executions.find((run) => run.status === "in_progress");

  const handleRun = async () => {
    try {
      await runMutation.mutateAsync({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success("Workflow execution completed.");
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to run workflow."));
    }
  };

  const isRunning = runMutation.isPending;

  return (
    <div className="space-y-6">
      {!canRun && (
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
          <p className="text-[14px] font-medium text-foreground">Execution unavailable</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {!canWrite
              ? "You do not have permission to run workflows."
              : workflow.status !== "active"
                ? "Set workflow status to active before running."
                : !workflow.is_active
                  ? "Enable this workflow to execute."
                  : "Add at least one step in the builder."}
          </p>
        </DashboardCard>
      )}

      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <Zap className={cn("size-4", accent.text)} />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Run workflow
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Triggers execution through{" "}
              <Link
                href={`/agent-teams/${workflow.agent_team_id}`}
                className="font-medium text-foreground transition-colors hover:text-brand"
              >
                {workflow.agent_team_name}
              </Link>
              . Creates an agent task and runs all steps sequentially.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="run-title">Title override (optional)</Label>
            <Input
              id="run-title"
              placeholder={workflow.name}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canRun || isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="run-description">Description override (optional)</Label>
            <textarea
              id="run-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canRun || isRunning}
              placeholder={workflow.description ?? "Run description"}
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>
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
            {isRunning ? "Running…" : "Run now"}
          </Button>
        </div>
      </DashboardCard>

      {executionsLoading && (
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading runs…
          </div>
        </DashboardCard>
      )}

      {activeRun && (
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Active run
              </p>
              <p className="mt-1 text-[15px] font-medium text-foreground">
                {activeRun.agent_task?.title ?? workflow.name}
              </p>
            </div>
            <ExecutionStatusBadge status={activeRun.status} />
          </div>
          {activeRun.agent_task?.executions && (
            <div className="mt-5">
              <WorkflowRunLogs executions={activeRun.agent_task.executions} />
            </div>
          )}
        </DashboardCard>
      )}
    </div>
  );
}
