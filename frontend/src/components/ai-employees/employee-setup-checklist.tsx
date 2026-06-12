"use client";

import { Check, Circle } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { AIEmployeeDetail } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface EmployeeSetupChecklistProps {
  employee: AIEmployeeDetail;
}

export function EmployeeSetupChecklist({ employee }: EmployeeSetupChecklistProps) {
  const accent = dashboardAccents.emerald;
  const hasKnowledge = employee.document_assignments.length > 0;
  const isActive = employee.status === "active";
  const canChat = isActive && hasKnowledge;

  const steps = [
    {
      label: "Create employee",
      description: "Profile and system prompt configured",
      complete: true,
    },
    {
      label: "Assign knowledge",
      description: "At least one embedded document",
      complete: hasKnowledge,
    },
    {
      label: "Activate employee",
      description: "Enable chat requests",
      complete: isActive,
    },
    {
      label: "Start chatting",
      description: "Send a message to test responses",
      complete: canChat,
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const allComplete = completedCount === steps.length;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Setup checklist
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {allComplete
              ? "This employee is ready for chat."
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
