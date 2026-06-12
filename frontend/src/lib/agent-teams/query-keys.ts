import type { AgentTaskStatus } from "@/lib/agent-teams/types";

export const agentTeamKeys = {
  all: ["agent-teams"] as const,
  lists: () => [...agentTeamKeys.all, "list"] as const,
  list: () => [...agentTeamKeys.lists()] as const,
  details: () => [...agentTeamKeys.all, "detail"] as const,
  detail: (id: string) => [...agentTeamKeys.details(), id] as const,
  members: (teamId: string) => [...agentTeamKeys.all, "members", teamId] as const,
};

export const agentTaskKeys = {
  all: ["agent-tasks"] as const,
  lists: () => [...agentTaskKeys.all, "list"] as const,
  list: (filters?: { teamId?: string; status?: AgentTaskStatus }) =>
    [...agentTaskKeys.lists(), filters ?? {}] as const,
  details: () => [...agentTaskKeys.all, "detail"] as const,
  detail: (id: string) => [...agentTaskKeys.details(), id] as const,
};
