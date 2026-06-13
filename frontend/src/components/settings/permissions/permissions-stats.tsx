"use client";

import { CircleOff, KeyRound, Layers, ShieldCheck } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computePermissionsStats } from "@/config/permissions";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { PermissionsStatsSkeleton } from "./permissions-skeleton";

interface PermissionsStatsProps {
  permissions: Permission[];
  isLoading?: boolean;
}

export function PermissionsStats({ permissions, isLoading = false }: PermissionsStatsProps) {
  if (isLoading) return <PermissionsStatsSkeleton />;

  const computed = computePermissionsStats(permissions);

  const stats = [
    {
      label: "Total permissions",
      value: String(computed.total),
      detail: "Catalog entries",
      icon: KeyRound,
      accent: "purple" as const,
    },
    {
      label: "Active permissions",
      value: String(computed.active),
      detail: `${computed.inactive} inactive`,
      icon: ShieldCheck,
      accent: "emerald" as const,
    },
    {
      label: "Resources covered",
      value: String(computed.resourcesCovered),
      detail: "Distinct resource groups",
      icon: Layers,
      accent: "blue" as const,
    },
    {
      label: "Custom permissions",
      value: String(computed.custom),
      detail: `${computed.seeded} default`,
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
