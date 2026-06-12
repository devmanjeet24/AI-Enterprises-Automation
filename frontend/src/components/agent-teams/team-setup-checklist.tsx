"use client";

import { Check, Circle } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { AgentTeamDetail } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface TeamSetupChecklistProps {
  team: AgentTeamDetail;
  hasUniqueSequence?: boolean;
}

export function TeamSetupChecklist({
  team,
  hasUniqueSequence = true,
}: TeamSetupChecklistProps) {
  const accent = dashboardAccents.blue;
  const hasMembers = team.members.length > 0;
  const allActiveMembers = team.members.every((m) => m.employee_status === "active");
  const canExecute = team.is_active && hasMembers && hasUniqueSequence && allActiveMembers;

  const steps = [
    {
      label: "Create team",
      description: "Name and configuration set",
      complete: true,
    },
    {
      label: "Assign members",
      description: "At least one active AI employee",
      complete: hasMembers && allActiveMembers,
    },
    {
      label: "Set sequence order",
      description: "Unique sequence_order per member",
      complete: hasMembers && hasUniqueSequence,
    },
    {
      label: "Ready to execute",
      description: "Active team with valid pipeline",
      complete: canExecute,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const allComplete = completedCount === steps.length;

  return (
    <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Setup checklist
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {allComplete
              ? "This team is ready to execute tasks."
              : `${completedCount} of ${steps.length} steps complete`}
          </p>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-[12px] font-medium",
            allComplete
              ? "border-success/30 bg-success/10 text-success"
              : cn(accent.bgSubtle, accent.border, accent.text),
          )}
        >
          {completedCount}/{steps.length}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
          >
            {step.complete ? (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10">
                <Check className="size-3 text-success" />
              </div>
            ) : (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1]">
                <Circle className="size-2.5 text-tertiary" />
              </div>
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[13px] font-medium",
                  step.complete ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="text-[11px] text-tertiary">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
