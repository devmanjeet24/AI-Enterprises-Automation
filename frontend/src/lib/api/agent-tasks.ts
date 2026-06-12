import { apiClient } from "@/lib/api/client";
import type { AgentTask, AgentTaskStatus } from "@/lib/agent-teams/types";

const AGENT_TASKS_BASE = "/api/v1/agent-tasks";

export interface ListAgentTasksParams {
  agent_team_id?: string;
  status?: AgentTaskStatus;
}

export function listAgentTasks(
  token: string,
  params?: ListAgentTasksParams,
): Promise<AgentTask[]> {
  const searchParams = new URLSearchParams();
  if (params?.agent_team_id) {
    searchParams.set("agent_team_id", params.agent_team_id);
  }
  if (params?.status) {
    searchParams.set("status", params.status);
  }
  const query = searchParams.toString();
  return apiClient<AgentTask[]>(
    `${AGENT_TASKS_BASE}${query ? `?${query}` : ""}`,
    { method: "GET", token },
  );
}

export function getAgentTask(token: string, taskId: string): Promise<AgentTask> {
  return apiClient<AgentTask>(`${AGENT_TASKS_BASE}/${taskId}`, {
    method: "GET",
    token,
  });
}

export function runAgentTask(token: string, taskId: string): Promise<AgentTask> {
  return apiClient<AgentTask>(`${AGENT_TASKS_BASE}/${taskId}/run`, {
    method: "POST",
    token,
  });
}
