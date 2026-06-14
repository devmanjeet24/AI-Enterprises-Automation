"use client";

import Link from "next/link";

import type { AgentTaskExecution } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ExecutionStatusBadge as StepStatusBadge } from "@/components/agent-teams/execution-status-badge";

interface WorkflowRunLogsProps {
  executions: AgentTaskExecution[];
}

export function WorkflowRunLogs({ executions }: WorkflowRunLogsProps) {
  const accent = dashboardAccents.purple;

  if (executions.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">No step logs recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {executions
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((execution) => (
          <li
            key={execution.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold",
                    accent.border,
                    accent.text,
                  )}
                >
                  {execution.sequence_order + 1}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {execution.ai_employee_id ? (
                      <Link
                        href={`/ai-employees/${execution.ai_employee_id}`}
                        className="transition-colors hover:text-brand"
                      >
                        {execution.employee_name ?? "Team member"}
                      </Link>
                    ) : (
                      (execution.employee_name ?? "Team member")
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {execution.collaboration_role}
                  </p>
                </div>
              </div>
              <StepStatusBadge status={execution.status} />
            </div>

            {execution.input_summary && (
              <p className="mt-3 text-[12px] text-muted-foreground">
                <span className="text-tertiary">Input: </span>
                {execution.input_summary}
              </p>
            )}
            {execution.output && (
              <p className="mt-2 text-[12px] text-foreground">
                <span className="text-tertiary">Output: </span>
                {execution.output}
              </p>
            )}
            {execution.error_message && (
              <p className="mt-2 text-[12px] text-destructive">
                {execution.error_message}
              </p>
            )}
          </li>
        ))}
    </ul>
  );
}
