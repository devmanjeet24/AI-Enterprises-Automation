import type { Department } from "@/lib/departments/types";
import type { Team, TeamStatusFilter } from "@/lib/teams/types";

export type {
  CreateTeamInput,
  Team,
  TeamStatusFilter,
  UpdateTeamInput,
} from "@/lib/teams/types";

export function getTeamInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
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

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function filterTeamsByStatus(teams: Team[], filter: TeamStatusFilter): Team[] {
  if (filter === "all") return teams;
  if (filter === "active") return teams.filter((team) => team.is_active);
  return teams.filter((team) => !team.is_active);
}

export function filterTeamsByDepartment(
  teams: Team[],
  departmentId: string | "all",
): Team[] {
  if (departmentId === "all") return teams;
  return teams.filter((team) => team.department_id === departmentId);
}

export function getDepartmentName(
  departmentId: string,
  departments: Department[],
): string {
  return departments.find((department) => department.id === departmentId)?.name ?? "Unknown";
}

export function computeTeamsStats(teams: Team[]) {
  const active = teams.filter((team) => team.is_active).length;
  const departments = new Set(teams.map((team) => team.department_id));
  return {
    total: teams.length,
    active,
    inactive: teams.length - active,
    departmentCount: departments.size,
  };
}
