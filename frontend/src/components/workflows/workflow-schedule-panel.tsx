"use client";

import { CalendarClock, Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { WorkflowDetail } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface WorkflowSchedulePanelProps {
  workflow: WorkflowDetail;
  canWrite?: boolean;
}

export function WorkflowSchedulePanel({
  workflow,
  canWrite = true,
}: WorkflowSchedulePanelProps) {
  const accent = dashboardAccents.purple;
  const [enabled, setEnabled] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [timezone, setTimezone] = useState("UTC");

  return (
    <div className="space-y-6">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-tertiary" />
          <div>
            <p className="text-[14px] font-medium text-foreground">
              Scheduling not yet available
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The backend currently supports manual runs via{" "}
              <span className="font-mono text-[12px]">POST /workflows/{"{id}"}/run</span>.
              This UI previews the schedule configuration experience for Phase 5b integration.
            </p>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <CalendarClock className={cn("size-4", accent.text)} />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Schedule — {workflow.name}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Configure recurring runs when scheduling APIs are available.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium text-foreground">Enable schedule</p>
              <p className="text-[12px] text-muted-foreground">
                Automatically trigger workflow runs
              </p>
            </div>
            <button
              type="button"
              onClick={() => canWrite && setEnabled((prev) => !prev)}
              disabled={!canWrite}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                !canWrite && "cursor-not-allowed opacity-60",
                enabled
                  ? "border-success/40 bg-success/20"
                  : "border-white/[0.12] bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  enabled ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-cron">Cron expression</Label>
            <Input
              id="schedule-cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              disabled={!canWrite || !enabled}
              className="font-mono text-[13px]"
              placeholder="0 9 * * 1"
            />
            <p className="text-[11px] text-tertiary">
              Example: every Monday at 09:00 UTC
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-timezone">Timezone</Label>
            <Input
              id="schedule-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!canWrite || !enabled}
            />
          </div>

          <Button variant="brand" size="sm" disabled={!canWrite || !enabled}>
            Save schedule
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
}
