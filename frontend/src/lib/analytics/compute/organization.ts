import type { DashboardOverview } from "@/lib/dashboard/types";
import type { Department } from "@/lib/departments/types";
import type { Permission } from "@/lib/permissions/types";
import type { Role } from "@/lib/roles/types";
import type { Team } from "@/lib/teams/types";
import type { User } from "@/lib/users/types";

import {
  countInLastDays,
  countWhere,
  percentOf,
} from "./utils";

export interface OrganizationGrowthSnapshot {
  usersLast7Days: number;
  usersLast30Days: number;
  usersLast90Days: number;
  departmentsLast30Days: number;
  teamsLast30Days: number;
}

export interface OrganizationStructureRow {
  departmentId: string;
  departmentName: string;
  teamCount: number;
  isActive: boolean;
}

export interface OrganizationAnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersWithoutRoles: number;
  roleCoveragePercent: number;
  totalDepartments: number;
  activeDepartments: number;
  totalTeams: number;
  activeTeams: number;
  avgTeamsPerDepartment: number;
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
  usersByStatus: { active: number; inactive: number };
  usersByRole: Record<string, number>;
  departmentsByStatus: { active: number; inactive: number };
  teamsByDepartment: Record<string, number>;
  workspaceResources: {
    users: number;
    departments: number;
    teams: number;
    roles: number;
    permissions: number;
  };
  growth: OrganizationGrowthSnapshot;
  structureRows: OrganizationStructureRow[];
  insights: string[];
}

export interface OrganizationAnalyticsInput {
  overview?: DashboardOverview | null;
  users?: User[] | null;
  departments?: Department[] | null;
  teams?: Team[] | null;
  roles?: Role[] | null;
  permissions?: Permission[] | null;
}

function buildInsights(metrics: Omit<OrganizationAnalyticsMetrics, "insights">): string[] {
  const insights: string[] = [];

  if (metrics.totalUsers > 0) {
    insights.push(
      `${metrics.activeUsers} of ${metrics.totalUsers} members are active (${percentOf(metrics.activeUsers, metrics.totalUsers)}%).`,
    );
  }

  if (metrics.usersWithoutRoles > 0) {
    insights.push(
      `${metrics.usersWithoutRoles} member${metrics.usersWithoutRoles === 1 ? "" : "s"} ha${metrics.usersWithoutRoles === 1 ? "s" : "ve"} no assigned roles.`,
    );
  } else if (metrics.totalUsers > 0) {
    insights.push("All members have at least one assigned role.");
  }

  if (metrics.totalDepartments > 0) {
    insights.push(
      `${metrics.totalTeams} org team${metrics.totalTeams === 1 ? "" : "s"} across ${metrics.totalDepartments} department${metrics.totalDepartments === 1 ? "" : "s"} (avg ${metrics.avgTeamsPerDepartment.toFixed(1)} per department).`,
    );
  }

  if (metrics.growth.usersLast7Days > 0) {
    insights.push(
      `${metrics.growth.usersLast7Days} new member${metrics.growth.usersLast7Days === 1 ? "" : "s"} joined in the last 7 days.`,
    );
  }

  if (metrics.inactiveUsers > 0) {
    insights.push(
      `${metrics.inactiveUsers} inactive member${metrics.inactiveUsers === 1 ? "" : "s"} may need review.`,
    );
  }

  if (insights.length === 0) {
    insights.push("Organization structure metrics will populate as workspace data is added.");
  }

  return insights.slice(0, 4);
}

export function computeOrganizationMetrics(
  input: OrganizationAnalyticsInput,
): OrganizationAnalyticsMetrics | null {
  const overview = input.overview;
  if (!overview) return null;

  const users = input.users ?? [];
  const departments = input.departments ?? [];
  const teams = input.teams ?? [];
  const roles = input.roles ?? [];
  const permissions = input.permissions ?? [];

  const activeUsers = countWhere(users, (user) => user.is_active);
  const inactiveUsers = users.length - activeUsers;
  const usersWithoutRoles = countWhere(users, (user) => user.roles.length === 0);
  const usersWithRoles = users.length - usersWithoutRoles;

  const activeDepartments = countWhere(departments, (department) => department.is_active);
  const activeTeams = countWhere(teams, (team) => team.is_active);
  const activeRoles = countWhere(roles, (role) => role.is_active);

  const usersByRole: Record<string, number> = {};
  for (const user of users) {
    for (const role of user.roles) {
      usersByRole[role.slug] = (usersByRole[role.slug] ?? 0) + 1;
    }
  }

  const teamsByDepartment: Record<string, number> = {};
  for (const team of teams) {
    teamsByDepartment[team.department_id] =
      (teamsByDepartment[team.department_id] ?? 0) + 1;
  }

  const structureRows: OrganizationStructureRow[] = departments
    .map((department) => ({
      departmentId: department.id,
      departmentName: department.name,
      teamCount: teamsByDepartment[department.id] ?? 0,
      isActive: department.is_active,
    }))
    .sort((left, right) => right.teamCount - left.teamCount);

  const departmentsWithNoTeams = structureRows.filter((row) => row.teamCount === 0).length;
  if (departmentsWithNoTeams > 0 && structureRows.length > 0) {
    // surfaced via insights indirectly through structure table
  }

  const growth: OrganizationGrowthSnapshot = {
    usersLast7Days: countInLastDays(users, 7),
    usersLast30Days: countInLastDays(users, 30),
    usersLast90Days: countInLastDays(users, 90),
    departmentsLast30Days: countInLastDays(departments, 30),
    teamsLast30Days: countInLastDays(teams, 30),
  };

  const totalDepartments = departments.length || overview.total_departments;
  const totalTeams = teams.length || overview.total_teams;
  const totalUsers = users.length || overview.total_users;

  const baseMetrics = {
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersWithoutRoles,
    roleCoveragePercent: percentOf(usersWithRoles, totalUsers),
    totalDepartments,
    activeDepartments,
    totalTeams,
    activeTeams,
    avgTeamsPerDepartment:
      totalDepartments > 0 ? totalTeams / totalDepartments : 0,
    totalRoles: roles.length,
    activeRoles,
    totalPermissions: permissions.length,
    usersByStatus: { active: activeUsers, inactive: inactiveUsers },
    usersByRole,
    departmentsByStatus: {
      active: activeDepartments,
      inactive: totalDepartments - activeDepartments,
    },
    teamsByDepartment,
    workspaceResources: {
      users: totalUsers,
      departments: totalDepartments,
      teams: totalTeams,
      roles: roles.length,
      permissions: permissions.length,
    },
    growth,
    structureRows,
  };

  const insights = buildInsights(baseMetrics);
  if (departmentsWithNoTeams > 0) {
    insights.push(
      `${departmentsWithNoTeams} department${departmentsWithNoTeams === 1 ? "" : "s"} ha${departmentsWithNoTeams === 1 ? "s" : "ve"} no teams yet.`,
    );
  }

  return {
    ...baseMetrics,
    insights: insights.slice(0, 4),
  };
}
