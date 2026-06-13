"use client";

import type { Department } from "@/lib/departments/types";
import type { Team } from "@/lib/teams/types";

import { DepartmentCard } from "./department-card";

interface DepartmentCardGridProps {
  departments: Department[];
  teams?: Team[];
}

export function DepartmentCardGrid({ departments, teams = [] }: DepartmentCardGridProps) {
  if (departments.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No departments match this filter.
      </p>
    );
  }

  const teamCountByDepartment = teams.reduce<Record<string, number>>((counts, team) => {
    counts[team.department_id] = (counts[team.department_id] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {departments.map((department) => (
        <DepartmentCard
          key={department.id}
          department={department}
          teamCount={teamCountByDepartment[department.id] ?? 0}
        />
      ))}
    </div>
  );
}
