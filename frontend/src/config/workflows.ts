import type { Workflow, WorkflowExecution } from "@/lib/workflows/types";

export type {
  AssignableAgentTeam,
  CreateWorkflowInput,
  RunWorkflowInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowDetail,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepDraft,
} from "@/lib/workflows/types";

export const workflowStatusLabels: Record<
  import("@/lib/workflows/types").WorkflowStatus,
  string
> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const executionStatusLabels: Record<
  import("@/lib/workflows/types").WorkflowExecutionStatus,
  string
> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function getWorkflowInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function computeWorkflowStats(
  workflows: Workflow[],
  executions?: WorkflowExecution[],
) {
  const totalRuns = executions?.length ?? 0;
  const completedRuns =
    executions?.filter((run) => run.status === "completed").length ?? 0;
  const activeWorkflows = workflows.filter(
    (workflow) => workflow.status === "active" && workflow.is_active,
  ).length;

  return {
    total: workflows.length,
    active: activeWorkflows,
    draft: workflows.filter((workflow) => workflow.status === "draft").length,
    archived: workflows.filter((workflow) => workflow.status === "archived").length,
    totalRuns,
    completedRuns,
    totalSteps: workflows.reduce((sum, workflow) => sum + workflow.steps.length, 0),
  };
}

export function slugifyWorkflowName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
