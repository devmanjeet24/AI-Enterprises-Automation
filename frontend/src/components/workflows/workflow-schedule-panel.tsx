"use client";

import { CalendarClock, Info } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { WorkflowDetail } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface WorkflowSchedulePanelProps {
  workflow: WorkflowDetail;
}

export function WorkflowSchedulePanel({ workflow }: WorkflowSchedulePanelProps) {
  const accent = dashboardAccents.purple;

  return (
    <div className="space-y-6">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
          <div>
            <p className="text-[14px] font-medium text-foreground">
              Scheduling not implemented yet
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Recurring workflow runs are not available in this release. Use manual runs via{" "}
              <span className="font-mono text-[12px]">POST /workflows/{"{id}"}/run</span>{" "}
              from the Run tab until scheduling ships.
            </p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-14 text-center"
      >
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl border",
            accent.bgSubtle,
            accent.border,
          )}
        >
          <CalendarClock className={cn("size-6", accent.text)} />
        </div>
        <h3 className="mt-5 text-[15px] font-medium text-foreground">
          Schedule — {workflow.name}
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          Cron-based scheduling and automated triggers will be added in a future release. Workflow
          configuration and manual execution are fully supported today.
        </p>
      </DashboardCard>
    </div>
  );
}
