"use client";

import { CheckCircle2, ClipboardList, Network, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeTeamStats } from "@/config/agent-teams";
import type { AgentTask, AgentTeam, AgentTeamDetail } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { TeamStatsSkeleton } from "./team-list-skeleton";

interface AgentTeamsStatsProps {
  teams: AgentTeam[];
  details?: AgentTeamDetail[];
  tasks?: Pick<AgentTask, "status">[];
  isLoading?: boolean;
}

export function AgentTeamsStats({
  teams,
  details,
  tasks,
  isLoading = false,
}: AgentTeamsStatsProps) {
  if (isLoading) return <TeamStatsSkeleton />;

  const computed = computeTeamStats(teams, details, tasks);

  const stats = [
    {
      label: "Total teams",
      value: computed.total,
      detail: "Across your organization",
      icon: Network,
      accent: "blue" as const,
    },
    {
      label: "Active teams",
      value: computed.active,
      detail: "Ready to execute tasks",
      icon: CheckCircle2,
      accent: "emerald" as const,
    },
    {
      label: "With members",
      value: computed.withMembers,
      detail: details ? "Employees assigned" : "View detail for counts",
      icon: Users,
      accent: "purple" as const,
    },
    {
      label: "Tasks completed",
      value: computed.completedTasks,
      detail: `${computed.totalTasks} total tasks`,
      icon: ClipboardList,
      accent: "gold" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const statAccent = dashboardAccents[stat.accent];
        const Icon = stat.icon;
        return (
          <DashboardCard
            key={stat.label}
            variant="kpi"
            accent={stat.accent}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  statAccent.bgSubtle,
                  statAccent.border,
                )}
              >
                <Icon className={cn("size-3.5", statAccent.text)} />
              </div>
            </div>
            <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em] text-foreground">
              {stat.value}
            </p>
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>
              {stat.detail}
            </p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
