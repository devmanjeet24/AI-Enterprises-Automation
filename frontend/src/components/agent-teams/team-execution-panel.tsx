"use client";

import { Loader2, Play, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useRunAgentTask, useSubmitTeamTask } from "@/hooks/use-agent-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AgentTask, AgentTeamDetail } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { ExecutionStatusBadge } from "./execution-status-badge";
import { TaskStatusBadge } from "./task-status-badge";

interface TeamExecutionPanelProps {
  team: AgentTeamDetail;
  tasks: AgentTask[];
  tasksLoading?: boolean;
  canExecute?: boolean;
}

export function TeamExecutionPanel({
  team,
  tasks,
  tasksLoading = false,
  canExecute: canExecutePermission = true,
}: TeamExecutionPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const submitMutation = useSubmitTeamTask(team.id);
  const runMutation = useRunAgentTask(team.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const canExecute =
    canExecutePermission &&
    team.is_active &&
    team.members.length > 0 &&
    team.members.every((member) => member.employee_status === "active");

  const pendingTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "failed",
  );
  const activeTask = tasks.find((task) => task.status === "in_progress");

  const handleSubmitTask = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      await submitMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Task submitted. Run it when ready.");
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit task."));
    }
  };

  const handleRunTask = async (taskId: string) => {
    setRunningTaskId(taskId);
    try {
      await runMutation.mutateAsync(taskId);
      toast.success("Task execution started.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to run task."));
    } finally {
      setRunningTaskId(null);
    }
  };

  const isSubmitting = submitMutation.isPending;

  return (
    <div className="space-y-6">
      {!canExecute && (
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
          <p className="text-[14px] font-medium text-foreground">Execution unavailable</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {!canExecutePermission
              ? "You do not have permission to execute team tasks."
              : !team.is_active
                ? "Activate this team to submit and run tasks."
                : team.members.length === 0
                  ? "Assign at least one active member before executing."
                  : "All members must be active employees."}
          </p>
        </DashboardCard>
      )}

      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Submit task
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Create a task for this team. Execution steps are pre-created for each
            member in sequence order.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Q3 Competitive Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canExecute || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <textarea
              id="task-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canExecute || isSubmitting}
              placeholder="Describe what the team should accomplish…"
              className={cn(
                "flex w-full resize-none rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-foreground transition-colors",
                "placeholder:text-tertiary",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>
          <Button
            variant="brand"
            size="sm"
            disabled={!canExecute || !title.trim() || !description.trim() || isSubmitting}
            onClick={handleSubmitTask}
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Submit task
          </Button>
        </div>
      </DashboardCard>

      {tasksLoading && (
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading tasks…
          </div>
        </DashboardCard>
      )}

      {activeTask && (
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Running task
              </p>
              <p className="mt-1 text-[15px] font-medium text-foreground">
                {activeTask.title}
              </p>
            </div>
            <TaskStatusBadge status={activeTask.status} />
          </div>

          {activeTask.executions && activeTask.executions.length > 0 && (
            <ul className="mt-5 space-y-2">
              {activeTask.executions
                .sort((a, b) => a.sequence_order - b.sequence_order)
                .map((execution) => (
                  <li
                    key={execution.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold",
                        accent.border,
                        accent.text,
                      )}
                    >
                      {execution.sequence_order + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">
                        {execution.employee_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {execution.collaboration_role}
                      </p>
                    </div>
                    <ExecutionStatusBadge status={execution.status} />
                  </li>
                ))}
            </ul>
          )}
        </DashboardCard>
      )}

      {!tasksLoading && pendingTasks.length > 0 && (
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Ready to run
          </p>
          <ul className="mt-4 space-y-2">
            {pendingTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground">
                    {task.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
                    {task.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <Button
                    variant="brand"
                    size="sm"
                    disabled={
                      !canExecute ||
                      runningTaskId === task.id ||
                      runMutation.isPending
                    }
                    onClick={() => handleRunTask(task.id)}
                  >
                    {runningTaskId === task.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    Run
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}
    </div>
  );
}
