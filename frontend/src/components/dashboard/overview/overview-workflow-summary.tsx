"use client";

import { Badge } from "@/components/ui/badge";
import { workflowSummary } from "@/config/dashboard";
import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const statusConfig = {
  running: { label: "Running", variant: "brand" as const, accent: "blue" as const },
  scheduled: { label: "Scheduled", variant: "outline" as const, accent: "purple" as const },
  completed: { label: "Done", variant: "success" as const, accent: "emerald" as const },
  failed: { label: "Failed", variant: "destructive" as const, accent: "neutral" as const },
};

const workflowAccents: DashboardAccent[] = ["blue", "purple", "gold", "emerald"];

export function OverviewWorkflowSummary() {
  const running = workflowSummary.filter((w) => w.status === "running").length;

  return (
    <DashboardCard variant="panel" accent="purple" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Workflows"
        subtitle={`${running} running now`}
        action={{ label: "Manage" }}
        accent="purple"
      />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {workflowSummary.map((workflow, index) => {
          const status = statusConfig[workflow.status];
          const accent = dashboardAccents[workflowAccents[index % workflowAccents.length]];
          const barAccent = dashboardAccents[status.accent];

          return (
            <div
              key={workflow.id}
              className={cn(
                "group rounded-xl border bg-gradient-to-br from-white/[0.025] to-transparent p-4 transition-all duration-300",
                accent.border,
                accent.borderHover,
                "hover:bg-white/[0.02]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {workflow.name}
                    </p>
                    <Badge variant={status.variant} className="h-[18px] shrink-0 px-1.5 text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {workflow.runsToday} runs today
                  </p>
                </div>
                <span className={cn("shrink-0 text-[13px] font-medium tabular-nums", accent.text)}>
                  {workflow.progress}%
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full", barAccent.bar)}
                  style={{ width: `${workflow.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
