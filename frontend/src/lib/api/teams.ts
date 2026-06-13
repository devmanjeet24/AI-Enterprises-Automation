import { apiClient } from "@/lib/api/client";
import type { CreateTeamInput, Team, UpdateTeamInput } from "@/lib/teams/types";

const TEAMS_BASE = "/api/v1/teams";

export function listTeams(token: string): Promise<Team[]> {
  return apiClient<Team[]>(TEAMS_BASE, { method: "GET", token });
}

export function getTeam(token: string, teamId: string): Promise<Team> {
  return apiClient<Team>(`${TEAMS_BASE}/${teamId}`, {
    method: "GET",
    token,
  });
}

export function createTeam(token: string, input: CreateTeamInput): Promise<Team> {
  return apiClient<Team>(TEAMS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateTeam(
  token: string,
  teamId: string,
  input: UpdateTeamInput,
): Promise<Team> {
  return apiClient<Team>(`${TEAMS_BASE}/${teamId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteTeam(token: string, teamId: string): Promise<void> {
  return apiClient<void>(`${TEAMS_BASE}/${teamId}`, {
    method: "DELETE",
    token,
  });
}
