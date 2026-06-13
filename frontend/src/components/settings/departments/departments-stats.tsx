"use client";

import { Building2, CircleOff, Network, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeDepartmentsStats } from "@/config/departments";
import type { Department } from "@/lib/departments/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DepartmentsStatsSkeleton } from "./departments-skeleton";

interface DepartmentsStatsProps {
  departments: Department[];
  teamCount?: number;
  isLoading?: boolean;
}

export function DepartmentsStats({
  departments,
  teamCount = 0,
  isLoading = false,
}: DepartmentsStatsProps) {
  if (isLoading) return <DepartmentsStatsSkeleton />;

  const computed = computeDepartmentsStats(departments);

  const stats = [
    {
      label: "Total departments",
      value: String(computed.total),
      detail: "Top-level org units",
      icon: Building2,
      accent: "blue" as const,
    },
    {
      label: "Active departments",
      value: String(computed.active),
      detail: `${computed.inactive} inactive`,
      icon: Users,
      accent: "emerald" as const,
    },
    {
      label: "Inactive departments",
      value: String(computed.inactive),
      detail: "Deactivated units",
      icon: CircleOff,
      accent: "neutral" as const,
    },
    {
      label: "Linked org teams",
      value: String(teamCount),
      detail: "Teams across departments",
      icon: Network,
      accent: "purple" as const,
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
