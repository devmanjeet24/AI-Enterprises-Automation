import { apiClient } from "@/lib/api/client";
import type {
  BrowserAnalytics,
  BrowserTask,
  BrowserTaskExecution,
  BrowserTaskExecutionSummary,
  CreateBrowserTaskInput,
  UpdateBrowserTaskInput,
} from "@/lib/browser-automation/types";

const BROWSER_TASKS_BASE = "/api/v1/browser-tasks";

export function getBrowserAnalytics(token: string): Promise<BrowserAnalytics> {
  return apiClient<BrowserAnalytics>(`${BROWSER_TASKS_BASE}/analytics`, {
    method: "GET",
    token,
  });
}

export function listBrowserTasks(
  token: string,
  browserProfileId?: string,
): Promise<BrowserTask[]> {
  const query = browserProfileId ? `?browser_profile_id=${browserProfileId}` : "";
  return apiClient<BrowserTask[]>(`${BROWSER_TASKS_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function getBrowserTask(token: string, taskId: string): Promise<BrowserTask> {
  return apiClient<BrowserTask>(`${BROWSER_TASKS_BASE}/${taskId}`, {
    method: "GET",
    token,
  });
}

export function createBrowserTask(
  token: string,
  input: CreateBrowserTaskInput,
): Promise<BrowserTask> {
  return apiClient<BrowserTask>(BROWSER_TASKS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateBrowserTask(
  token: string,
  taskId: string,
  input: UpdateBrowserTaskInput,
): Promise<BrowserTask> {
  return apiClient<BrowserTask>(`${BROWSER_TASKS_BASE}/${taskId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteBrowserTask(token: string, taskId: string): Promise<void> {
  return apiClient<void>(`${BROWSER_TASKS_BASE}/${taskId}`, {
    method: "DELETE",
    token,
  });
}

export function runBrowserTask(
  token: string,
  taskId: string,
): Promise<BrowserTaskExecution> {
  return apiClient<BrowserTaskExecution>(`${BROWSER_TASKS_BASE}/${taskId}/run`, {
    method: "POST",
    token,
    body: {},
  });
}

export function listBrowserTaskExecutions(
  token: string,
  taskId: string,
): Promise<BrowserTaskExecutionSummary[]> {
  return apiClient<BrowserTaskExecutionSummary[]>(
    `${BROWSER_TASKS_BASE}/${taskId}/executions`,
    { method: "GET", token },
  );
}

export function listOrgBrowserExecutions(
  token: string,
  browserTaskId?: string,
): Promise<BrowserTaskExecutionSummary[]> {
  const query = browserTaskId ? `?browser_task_id=${browserTaskId}` : "";
  return apiClient<BrowserTaskExecutionSummary[]>(
    `${BROWSER_TASKS_BASE}/executions${query}`,
    { method: "GET", token },
  );
}

export function getBrowserExecution(
  token: string,
  executionId: string,
): Promise<BrowserTaskExecution> {
  return apiClient<BrowserTaskExecution>(
    `${BROWSER_TASKS_BASE}/executions/${executionId}`,
    { method: "GET", token },
  );
}
