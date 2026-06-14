"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { OverviewWorkflowItem } from "@/lib/dashboard/types";
import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const statusConfig = {
  running: { label: "Running", variant: "brand" as const, accent: "blue" as const },
  pending: { label: "Pending", variant: "outline" as const, accent: "gold" as const },
  completed: { label: "Done", variant: "success" as const, accent: "emerald" as const },
  failed: { label: "Failed", variant: "destructive" as const, accent: "neutral" as const },
  cancelled: { label: "Cancelled", variant: "outline" as const, accent: "neutral" as const },
  ready: { label: "Ready", variant: "outline" as const, accent: "emerald" as const },
  draft: { label: "Draft", variant: "outline" as const, accent: "neutral" as const },
  archived: { label: "Archived", variant: "outline" as const, accent: "gold" as const },
  inactive: { label: "Inactive", variant: "outline" as const, accent: "neutral" as const },
};

const workflowAccents: DashboardAccent[] = ["blue", "purple", "gold", "emerald"];

interface OverviewWorkflowSummaryProps {
  workflows: OverviewWorkflowItem[];
  runningCount: number;
  isLoading?: boolean;
}

export function OverviewWorkflowSummary({
  workflows,
  runningCount,
  isLoading,
}: OverviewWorkflowSummaryProps) {
  return (
    <DashboardCard variant="panel" accent="purple" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Workflows"
        subtitle={isLoading ? "Loading workflows…" : `${runningCount} running now`}
        action={{ label: "Manage", href: "/workflows" }}
        accent="purple"
      />
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {workflows.length === 0 && !isLoading ? (
          <div className="col-span-full py-8 text-center text-[13px] text-muted-foreground">
            No workflows created yet.
          </div>
        ) : (
          workflows.map((workflow, index) => {
            const status = statusConfig[workflow.status];
            const accent = dashboardAccents[workflowAccents[index % workflowAccents.length]];
            const barAccent = dashboardAccents[status.accent];

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className={cn(
                  "group block rounded-xl border bg-gradient-to-br from-white/[0.025] to-transparent p-4 transition-all duration-300",
                  accent.border,
                  accent.borderHover,
                  "hover:bg-white/[0.02]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-brand">
                        {workflow.name}
                      </p>
                      <Badge variant={status.variant} className="h-[18px] shrink-0 px-1.5 text-[10px]">
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {workflow.runsToday} run{workflow.runsToday === 1 ? "" : "s"} today
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
              </Link>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
