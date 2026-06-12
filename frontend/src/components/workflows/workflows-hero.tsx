"use client";

import { CheckCircle2, GitBranch, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeWorkflowStats } from "@/config/workflows";
import type { Workflow, WorkflowExecution } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface WorkflowsHeroProps {
  workflows: Workflow[];
  executions?: WorkflowExecution[];
  canCreate?: boolean;
  onCreateClick: () => void;
}

export function WorkflowsHero({
  workflows,
  executions,
  canCreate = true,
  onCreateClick,
}: WorkflowsHeroProps) {
  const accent = dashboardAccents.purple;
  const stats = computeWorkflowStats(workflows, executions);

  const heroStats = [
    { icon: GitBranch, label: "Total workflows", value: stats.total },
    { icon: CheckCircle2, label: "Active", value: stats.active },
    { icon: Layers, label: "Total steps", value: stats.totalSteps },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Workflow Automation
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Build reusable{" "}
            <span className={accent.text}>automation pipelines</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Define ordered steps on agent teams, activate workflows, and run
            them on demand with full execution history.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl border",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <Icon className={cn("size-4", accent.text)} />
              </div>
              <div>
                <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {canCreate && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create workflow
          </Button>
        )}
        <p className="text-[12px] text-tertiary">
          Define steps → Activate → Run pipeline
        </p>
      </div>
    </section>
  );
}
