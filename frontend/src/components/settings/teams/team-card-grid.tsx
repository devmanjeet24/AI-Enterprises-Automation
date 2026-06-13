"use client";

import type { Department } from "@/lib/departments/types";
import { getDepartmentName } from "@/config/teams";
import type { Team } from "@/lib/teams/types";

import { TeamCard } from "./team-card";

interface TeamCardGridProps {
  teams: Team[];
  departments: Department[];
}

export function TeamCardGrid({ teams, departments }: TeamCardGridProps) {
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
          departmentName={getDepartmentName(team.department_id, departments)}
        />
      ))}
    </div>
  );
}
