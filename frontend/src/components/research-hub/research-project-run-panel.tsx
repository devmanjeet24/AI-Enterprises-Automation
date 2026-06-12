"use client";

import { Loader2, Play, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useRunResearchProject } from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ResearchProjectDetail } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ResearchProjectRunPanelProps {
  project: ResearchProjectDetail;
  canExecute?: boolean;
  onRunSuccess?: () => void;
}

export function ResearchProjectRunPanel({
  project,
  canExecute = true,
  onRunSuccess,
}: ResearchProjectRunPanelProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const runMutation = useRunResearchProject(project.id);

  const canRun =
    canExecute &&
    project.is_active &&
    project.status === "active" &&
    Boolean(project.research_brief?.trim());

  const handleRun = async () => {
    try {
      const report = await runMutation.mutateAsync({});
      toast.success(`Research run v${report.version_number} completed.`);
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
          <p className="mt-1 text-[13px] text-muted-foreground">
            {!canExecute
              ? "You do not have permission to execute research projects."
              : project.status !== "active"
                ? "Set project status to active before running research."
                : !project.is_active
                  ? "Enable this project to run research."
                  : "Add a research brief in the overview tab before running."}
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
