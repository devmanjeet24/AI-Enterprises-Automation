"use client";

import { AlertCircle, Loader2, Play, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useRunResearchProject } from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  canRunResearchProject,
  getResearchRunBlockedMessage,
} from "@/lib/research-hub/run-messages";
import type { ResearchProjectDetail, ResearchReport } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ResearchProjectRunPanelProps {
  project: ResearchProjectDetail;
  canExecute?: boolean;
  canWrite?: boolean;
  onRunSuccess?: () => void;
}

export function ResearchProjectRunPanel({
  project,
  canExecute = true,
  canWrite = true,
  onRunSuccess,
}: ResearchProjectRunPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const runMutation = useRunResearchProject(project.id);
  const [lastRunResult, setLastRunResult] = useState<ResearchReport | null>(null);

  const canRun = canRunResearchProject(project, canExecute);
  const blockedMessage = getResearchRunBlockedMessage(project, {
    canExecute,
    canWrite,
  });

  const handleRun = async () => {
    setLastRunResult(null);
    try {
      const report = await runMutation.mutateAsync({});
      setLastRunResult(report);

      if (report.status === "completed") {
        toast.success(`Research run v${report.version_number} completed.`);
        onRunSuccess?.();
        return;
      }

      if (report.status === "failed") {
        toast.error(
          report.error_message ?? `Research run v${report.version_number} failed.`,
        );
        onRunSuccess?.();
        return;
      }

      toast.success(`Research run v${report.version_number} started.`);
      onRunSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to run research."));
    }
  };

  const isRunning = runMutation.isPending;

  return (
    <div className="space-y-4">
      {!canRun && (
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
          <p className="text-[14px] font-medium text-foreground">Research unavailable</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{blockedMessage}</p>
        </DashboardCard>
      )}

      {lastRunResult?.status === "failed" && (
        <DashboardCard
          variant="panel"
          accent="purple"
          interactive={false}
          className="border-destructive/20 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-[14px] font-medium text-foreground">
                Run v{lastRunResult.version_number} failed
              </p>
              <p className="mt-1 text-[13px] text-destructive">
                {lastRunResult.error_message ?? "The agent team could not complete this run."}
              </p>
            </div>
          </div>
        </DashboardCard>
      )}

      {lastRunResult &&
        (lastRunResult.status === "pending" || lastRunResult.status === "in_progress") && (
          <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-brand" />
              <div>
                <p className="text-[14px] font-medium text-foreground">
                  Run v{lastRunResult.version_number} in progress
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Agent team is executing template steps. Reports and history will update
                  automatically.
                </p>
              </div>
            </div>
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
            <Search className={cn("size-4", accent.text)} />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Run research
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Executes the methodology template through{" "}
              <span className="text-foreground">{project.agent_team_name}</span>.
              Generates a versioned report from the research brief.
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
            {isRunning ? "Running research…" : "Run research"}
          </Button>
          {isRunning && (
            <p className="text-[12px] text-muted-foreground">
              Agent team is executing template steps…
            </p>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
