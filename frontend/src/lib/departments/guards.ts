import type { Team } from "@/lib/teams/types";

export function getDepartmentDeleteBlockedMessage(teams: Team[]): string | null {
  if (teams.length === 0) return null;
  const label = teams.length === 1 ? "team" : "teams";
  return `Cannot delete: ${teams.length} ${label} still belong to this department. Remove or reassign them first.`;
}
