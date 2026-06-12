"use client";

import type { AgentTeam, AgentTeamDetail } from "@/lib/agent-teams/types";

import { getMemberCountForTeam, TeamCard } from "./team-card";

interface TeamCardGridProps {
  teams: AgentTeam[];
  details?: AgentTeamDetail[];
}

export function TeamCardGrid({ teams, details }: TeamCardGridProps) {
  if (teams.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No teams match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          memberCount={getMemberCountForTeam(team, details)}
        />
      ))}
    </div>
  );
}
