"use client";

import { CircleOff, Shield, ShieldCheck, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeRolesStats } from "@/config/roles";
import type { Role } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { RolesStatsSkeleton } from "./roles-skeleton";

interface RolesStatsProps {
  roles: Role[];
  isLoading?: boolean;
}

export function RolesStats({ roles, isLoading = false }: RolesStatsProps) {
  if (isLoading) return <RolesStatsSkeleton />;

  const computed = computeRolesStats(roles);

  const stats = [
    {
      label: "Total roles",
      value: String(computed.total),
      detail: "System and custom roles",
      icon: Shield,
      accent: "purple" as const,
    },
    {
      label: "System roles",
      value: String(computed.system),
      detail: "Built-in access bundles",
      icon: ShieldCheck,
      accent: "blue" as const,
    },
    {
      label: "Custom roles",
      value: String(computed.custom),
      detail: "Organization-defined",
      icon: Users,
      accent: "emerald" as const,
    },
    {
      label: "Active roles",
      value: String(computed.active),
      detail: `${computed.inactive} inactive`,
      icon: CircleOff,
      accent: "neutral" as const,
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
