"use client";

import { CheckCircle2, ClipboardList, GitBranch, Layers } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeWorkflowStats } from "@/config/workflows";
import type { Workflow, WorkflowExecution } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { WorkflowStatsSkeleton } from "./workflow-list-skeleton";

interface WorkflowsStatsProps {
  workflows: Workflow[];
  executions?: WorkflowExecution[];
  isLoading?: boolean;
}

export function WorkflowsStats({
  workflows,
  executions,
  isLoading = false,
}: WorkflowsStatsProps) {
  if (isLoading) return <WorkflowStatsSkeleton />;

  const computed = computeWorkflowStats(workflows, executions);

  const stats = [
    {
      label: "Total workflows",
      value: computed.total,
      detail: "Across your organization",
      icon: GitBranch,
      accent: "purple" as const,
    },
    {
      label: "Active workflows",
      value: computed.active,
      detail: `${computed.draft} in draft`,
      icon: CheckCircle2,
      accent: "emerald" as const,
    },
    {
      label: "Total steps",
      value: computed.totalSteps,
      detail: "Ordered pipeline steps",
      icon: Layers,
      accent: "blue" as const,
    },
    {
      label: "Runs completed",
      value: computed.completedRuns,
      detail: `${computed.totalRuns} total runs`,
      icon: ClipboardList,
      accent: "gold" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const statAccent = dashboardAccents[stat.accent];
        const Icon = stat.icon;
        return (
          <DashboardCard
            key={stat.label}
            variant="kpi"
            accent={stat.accent}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  statAccent.bgSubtle,
                  statAccent.border,
                )}
              >
                <Icon className={cn("size-3.5", statAccent.text)} />
              </div>
            </div>
            <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em] text-foreground">
              {stat.value}
            </p>
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>
              {stat.detail}
            </p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
