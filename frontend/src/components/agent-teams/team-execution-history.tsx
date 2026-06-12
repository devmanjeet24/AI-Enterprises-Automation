"use client";

import { ChevronDown, ChevronRight, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate } from "@/config/agent-teams";
import type { AgentTask } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ExecutionStatusBadge } from "./execution-status-badge";
import { TaskStatusBadge } from "./task-status-badge";

interface TeamExecutionHistoryProps {
  tasks: AgentTask[];
  isLoading?: boolean;
}

export function TeamExecutionHistory({
  tasks,
  isLoading = false,
}: TeamExecutionHistoryProps) {
  const accent = dashboardAccents.blue;
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  if (isLoading) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" />
        Loading execution history…
      </DashboardCard>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Clock className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">
          No execution history
        </h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Submit and run a task to see step-by-step execution history here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map((task) => {
        const isExpanded = expandedTaskId === task.id;
        const executions = task.executions ?? [];

        return (
          <DashboardCard
            key={task.id}
            variant="panel"
            accent="blue"
            interactive={false}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
              className="flex w-full items-start gap-3 p-5 text-left"
            >
              {isExpanded ? (
                <ChevronDown className="mt-0.5 size-4 shrink-0 text-tertiary" />
              ) : (
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-tertiary" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-foreground">{task.title}</p>
                  <TaskStatusBadge status={task.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                  {task.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-tertiary">
                  <span>{formatRelativeDate(task.updated_at)}</span>
                  {task.result && <span className="text-emerald-400">Result available</span>}
                  {executions.length > 0 && (
                    <span>{executions.length} execution steps</span>
                  )}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-white/[0.06] px-5 pb-5">
                {task.result && (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-emerald-400">
                      Final result
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                      {task.result}
                    </p>
                  </div>
                )}

                {executions.length > 0 ? (
                  <ul className="mt-4 space-y-2">
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
                                  {execution.employee_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {execution.collaboration_role}
                                </p>
                              </div>
                            </div>
                            <ExecutionStatusBadge status={execution.status} />
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
                ) : (
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    No execution steps recorded yet. Run this task to start the pipeline.
                  </p>
                )}
              </div>
            )}
          </DashboardCard>
        );
      })}
    </div>
  );
}
