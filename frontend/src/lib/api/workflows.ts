import { apiClient } from "@/lib/api/client";
import type {
  CreateWorkflowInput,
  RunWorkflowInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowExecution,
  WorkflowStatus,
} from "@/lib/workflows/types";

const WORKFLOWS_BASE = "/api/v1/workflows";

export function listWorkflows(
  token: string,
  status?: WorkflowStatus,
): Promise<Workflow[]> {
  const query = status ? `?status=${status}` : "";
  return apiClient<Workflow[]>(`${WORKFLOWS_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function getWorkflow(token: string, workflowId: string): Promise<Workflow> {
  return apiClient<Workflow>(`${WORKFLOWS_BASE}/${workflowId}`, {
    method: "GET",
    token,
  });
}

export function createWorkflow(
  token: string,
  input: CreateWorkflowInput,
): Promise<Workflow> {
  return apiClient<Workflow>(WORKFLOWS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateWorkflow(
  token: string,
  workflowId: string,
  input: UpdateWorkflowInput,
): Promise<Workflow> {
  return apiClient<Workflow>(`${WORKFLOWS_BASE}/${workflowId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteWorkflow(token: string, workflowId: string): Promise<void> {
  return apiClient<void>(`${WORKFLOWS_BASE}/${workflowId}`, {
    method: "DELETE",
    token,
  });
}

export function runWorkflow(
  token: string,
  workflowId: string,
  input: RunWorkflowInput = {},
): Promise<WorkflowExecution> {
  return apiClient<WorkflowExecution>(`${WORKFLOWS_BASE}/${workflowId}/run`, {
    method: "POST",
    token,
    body: input,
  });
}

export function listWorkflowExecutions(
  token: string,
  workflowId: string,
): Promise<WorkflowExecution[]> {
  return apiClient<WorkflowExecution[]>(
    `${WORKFLOWS_BASE}/${workflowId}/executions`,
    { method: "GET", token },
  );
}
