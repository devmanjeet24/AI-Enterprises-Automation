"use client";

import { Shield, UserCheck, Users, UserX } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeUsersStats } from "@/config/users";
import type { User } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { UsersStatsSkeleton } from "./users-skeleton";

interface UsersStatsProps {
  users: User[];
  isLoading?: boolean;
}

export function UsersStats({ users, isLoading = false }: UsersStatsProps) {
  if (isLoading) return <UsersStatsSkeleton />;

  const computed = computeUsersStats(users);

  const stats = [
    {
      label: "Total users",
      value: String(computed.total),
      detail: "Across your organization",
      icon: Users,
      accent: "emerald" as const,
    },
    {
      label: "Active users",
      value: String(computed.active),
      detail: `${computed.inactive} inactive`,
      icon: UserCheck,
      accent: "blue" as const,
    },
    {
      label: "Inactive users",
      value: String(computed.inactive),
      detail: "Deactivated accounts",
      icon: UserX,
      accent: "neutral" as const,
    },
    {
      label: "Administrators",
      value: String(computed.admins),
      detail: "Active admin role holders",
      icon: Shield,
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
