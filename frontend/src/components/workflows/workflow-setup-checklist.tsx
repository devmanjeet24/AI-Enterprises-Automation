"use client";

import { Check, Circle } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { WorkflowDetail } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface WorkflowSetupChecklistProps {
  workflow: WorkflowDetail;
}

export function WorkflowSetupChecklist({ workflow }: WorkflowSetupChecklistProps) {
  const accent = dashboardAccents.purple;
  const hasSteps = workflow.steps.length > 0;
  const uniqueOrders =
    workflow.steps.length ===
    new Set(workflow.steps.map((step) => step.sequence_order)).size;
  const isActiveStatus = workflow.status === "active";
  const canRun =
    workflow.is_active && isActiveStatus && hasSteps && uniqueOrders;

  const steps = [
    {
      label: "Create workflow",
      description: "Name and agent team assigned",
      complete: true,
    },
    {
      label: "Define steps",
      description: "At least one ordered step",
      complete: hasSteps && uniqueOrders,
    },
    {
      label: "Activate workflow",
      description: "Status set to active",
      complete: isActiveStatus && workflow.is_active,
    },
    {
      label: "Ready to run",
      description: "Active workflow with valid pipeline",
      complete: canRun,
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;
  const allComplete = completedCount === steps.length;

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Setup checklist
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {allComplete
              ? "This workflow is ready to execute."
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
