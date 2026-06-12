import type { WorkflowStatus } from "@/lib/workflows/types";

export const workflowKeys = {
  all: ["workflows"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  list: (status?: WorkflowStatus) =>
    [...workflowKeys.lists(), { status: status ?? "all" }] as const,
  details: () => [...workflowKeys.all, "detail"] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
  executions: (workflowId: string) =>
    [...workflowKeys.all, "executions", workflowId] as const,
  assignableTeams: () => [...workflowKeys.all, "assignable-teams"] as const,
};
