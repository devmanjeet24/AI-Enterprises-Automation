import type { AgentTask, AgentTeam, AgentTeamMember } from "@/lib/agent-teams/types";
import type { DashboardOverview } from "@/lib/dashboard/types";

import {
  average,
  countByField,
  countInLastDays,
  countWhere,
  percentOf,
} from "./utils";

export interface AgentTeamAnalyticsRow {
  teamId: string;
  teamName: string;
  isActive: boolean;
  memberCount: number;
  taskCount: number;
  completedTasks: number;
}

export interface AgentTeamsAnalyticsMetrics {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  teamsWithMembers: number;
  emptyTeams: number;
  avgMembersPerTeam: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  taskCompletionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByTeam: Record<string, number>;
  teamRows: AgentTeamAnalyticsRow[];
  recentTasks: AgentTask[];
  tasksLast7Days: number;
  tasksLast30Days: number;
  insights: string[];
}

export interface AgentTeamsAnalyticsInput {
  overview?: DashboardOverview | null;
  teams?: AgentTeam[] | null;
  tasks?: AgentTask[] | null;
  membersByTeam?: Record<string, AgentTeamMember[]>;
}

function buildInsights(
  metrics: Omit<AgentTeamsAnalyticsMetrics, "insights">,
): string[] {
  const insights: string[] = [];

  if (metrics.totalTeams === 0) {
    return ["Create agent teams to start tracking multi-agent collaboration metrics."];
  }

  insights.push(
    `${metrics.activeTeams} of ${metrics.totalTeams} teams are active (${percentOf(metrics.activeTeams, metrics.totalTeams)}%).`,
  );

  if (metrics.totalTasks > 0) {
    insights.push(
      `${metrics.completedTasks} of ${metrics.totalTasks} tasks completed (${metrics.taskCompletionRate}% success among finished runs).`,
    );
  }

  if (metrics.emptyTeams > 0) {
    insights.push(
      `${metrics.emptyTeams} team${metrics.emptyTeams === 1 ? "" : "s"} ha${metrics.emptyTeams === 1 ? "s" : "ve"} no assigned members yet.`,
    );
  }

  if (metrics.failedTasks > 0) {
    insights.push(
      `${metrics.failedTasks} failed task${metrics.failedTasks === 1 ? "" : "s"} may need investigation.`,
    );
  } else if (metrics.tasksLast7Days > 0) {
    insights.push(
      `${metrics.tasksLast7Days} new task${metrics.tasksLast7Days === 1 ? "" : "s"} created in the last 7 days.`,
    );
  }

  if (metrics.avgMembersPerTeam > 0) {
    insights.push(
      `Teams average ${metrics.avgMembersPerTeam.toFixed(1)} members per roster.`,
    );
  }

  return insights.slice(0, 4);
}

export function computeAgentTeamsMetrics(
  input: AgentTeamsAnalyticsInput,
): AgentTeamsAnalyticsMetrics | null {
  const overview = input.overview;
  if (!overview) return null;

  const teams = input.teams ?? [];
  const tasks = input.tasks ?? [];
  const membersByTeam = input.membersByTeam ?? {};

  const activeTeams = countWhere(teams, (team) => team.is_active);
  const inactiveTeams = teams.length - activeTeams;

  const memberCounts = teams.map((team) => (membersByTeam[team.id] ?? []).length);
  const teamsWithMembers = memberCounts.filter((count) => count > 0).length;
  const emptyTeams = teams.length - teamsWithMembers;
  const avgMembersPerTeam = average(memberCounts) ?? 0;

  const completedTasks = countWhere(tasks, (task) => task.status === "completed");
  const failedTasks = countWhere(tasks, (task) => task.status === "failed");
  const inProgressTasks = countWhere(tasks, (task) => task.status === "in_progress");
  const pendingTasks = countWhere(tasks, (task) => task.status === "pending");
  const cancelledTasks = countWhere(tasks, (task) => task.status === "cancelled");

  const finishedTasks = completedTasks + failedTasks + cancelledTasks;
  const taskCompletionRate = percentOf(completedTasks, finishedTasks);

  const tasksByStatus = countByField(tasks, (task) => task.status);
  const tasksByTeam = countByField(tasks, (task) => task.agent_team_id);

  const teamRows: AgentTeamAnalyticsRow[] = teams
    .map((team) => {
      const teamTasks = tasks.filter((task) => task.agent_team_id === team.id);
      return {
        teamId: team.id,
        teamName: team.name,
        isActive: team.is_active,
        memberCount: (membersByTeam[team.id] ?? []).length,
        taskCount: teamTasks.length,
        completedTasks: countWhere(teamTasks, (task) => task.status === "completed"),
      };
    })
    .sort((left, right) => right.taskCount - left.taskCount);

  const recentTasks = [...tasks]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 8);

  const totalTasks = tasks.length || overview.total_agent_tasks;

  const baseMetrics = {
    totalTeams: teams.length,
    activeTeams,
    inactiveTeams,
    teamsWithMembers,
    emptyTeams,
    avgMembersPerTeam,
    totalTasks,
    completedTasks,
    failedTasks,
    inProgressTasks,
    pendingTasks,
    cancelledTasks,
    taskCompletionRate,
    tasksByStatus,
    tasksByTeam,
    teamRows,
    recentTasks,
    tasksLast7Days: countInLastDays(tasks, 7),
    tasksLast30Days: countInLastDays(tasks, 30),
  };

  return {
    ...baseMetrics,
    insights: buildInsights(baseMetrics),
  };
}
