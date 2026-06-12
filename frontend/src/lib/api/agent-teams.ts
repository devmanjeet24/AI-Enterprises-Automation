import { apiClient } from "@/lib/api/client";
import type {
  AgentTask,
  AgentTeam,
  AgentTeamMember,
  CreateTaskInput,
  CreateTeamInput,
  TeamMemberDraft,
  UpdateTeamInput,
} from "@/lib/agent-teams/types";

const AGENT_TEAMS_BASE = "/api/v1/agent-teams";

export function listAgentTeams(token: string): Promise<AgentTeam[]> {
  return apiClient<AgentTeam[]>(AGENT_TEAMS_BASE, {
    method: "GET",
    token,
  });
}

export function getAgentTeam(token: string, teamId: string): Promise<AgentTeam> {
  return apiClient<AgentTeam>(`${AGENT_TEAMS_BASE}/${teamId}`, {
    method: "GET",
    token,
  });
}

export function createAgentTeam(
  token: string,
  input: CreateTeamInput,
): Promise<AgentTeam> {
  return apiClient<AgentTeam>(AGENT_TEAMS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateAgentTeam(
  token: string,
  teamId: string,
  input: UpdateTeamInput,
): Promise<AgentTeam> {
  return apiClient<AgentTeam>(`${AGENT_TEAMS_BASE}/${teamId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteAgentTeam(token: string, teamId: string): Promise<void> {
  return apiClient<void>(`${AGENT_TEAMS_BASE}/${teamId}`, {
    method: "DELETE",
    token,
  });
}

export function listTeamMembers(
  token: string,
  teamId: string,
): Promise<AgentTeamMember[]> {
  return apiClient<AgentTeamMember[]>(`${AGENT_TEAMS_BASE}/${teamId}/members`, {
    method: "GET",
    token,
  });
}

export function addTeamMember(
  token: string,
  teamId: string,
  input: TeamMemberDraft,
): Promise<AgentTeamMember> {
  return apiClient<AgentTeamMember>(`${AGENT_TEAMS_BASE}/${teamId}/members`, {
    method: "POST",
    token,
    body: input,
  });
}

export function removeTeamMember(
  token: string,
  teamId: string,
  memberId: string,
): Promise<void> {
  return apiClient<void>(`${AGENT_TEAMS_BASE}/${teamId}/members/${memberId}`, {
    method: "DELETE",
    token,
  });
}

export function submitTeamTask(
  token: string,
  teamId: string,
  input: CreateTaskInput,
): Promise<AgentTask> {
  return apiClient<AgentTask>(`${AGENT_TEAMS_BASE}/${teamId}/tasks`, {
    method: "POST",
    token,
    body: input,
  });
}
