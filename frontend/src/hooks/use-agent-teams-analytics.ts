"use client";

import { useQuery } from "@tanstack/react-query";

import { listAgentTeams, listTeamMembers } from "@/lib/api/agent-teams";
import { listAgentTasks } from "@/lib/api/agent-tasks";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { computeAgentTeamsMetrics } from "@/lib/analytics/compute/agent-teams";
import { fetchOptional } from "@/lib/analytics/fetch-optional";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { AgentTeamsAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useAgentTeamsAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.agentTeams(),
    queryFn: async (): Promise<AgentTeamsAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      const [teamsResult, tasksResult] = await Promise.all([
        fetchOptional(() => listAgentTeams(token!)),
        fetchOptional(() => listAgentTasks(token!)),
      ]);

      const teamsAccessDenied = teamsResult.accessDenied;
      const tasksAccessDenied = tasksResult.accessDenied;
      const teams = teamsResult.data ?? [];

      let membersAccessDenied = false;
      const membersByTeam: AgentTeamsAnalyticsSnapshot["membersByTeam"] = {};

      if (!teamsAccessDenied && teams.length > 0) {
        const memberResults = await Promise.all(
          teams.map((team) => fetchOptional(() => listTeamMembers(token!, team.id))),
        );

        membersAccessDenied = memberResults.some((result) => result.accessDenied);

        teams.forEach((team, index) => {
          if (memberResults[index]?.data) {
            membersByTeam[team.id] = memberResults[index].data!;
          }
        });
      }

      const hasPartialAccess =
        !teamsAccessDenied || !tasksAccessDenied || !membersAccessDenied;

      const metrics = computeAgentTeamsMetrics({
        overview,
        teams: teamsResult.data,
        tasks: tasksResult.data,
        membersByTeam,
      });

      return {
        overview,
        teams: teamsResult.data,
        tasks: tasksResult.data,
        membersByTeam,
        metrics,
        teamsAccessDenied,
        tasksAccessDenied,
        membersAccessDenied,
        hasPartialAccess,
      };
    },
    enabled: Boolean(token),
  });
}
