"use client";

import { Building2, FileText, Network, Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeSettingsStats } from "@/config/settings";
import type { DashboardOverview } from "@/lib/dashboard/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { SettingsError } from "./settings-error";
import { SettingsStatsSkeleton } from "./settings-skeleton";

interface SettingsStatsProps {
  overview?: DashboardOverview | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function formatMetricValue(value: number | null): string {
  return value == null ? "—" : String(value);
}

export function SettingsStats({
  overview,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: SettingsStatsProps) {
  if (isLoading) return <SettingsStatsSkeleton />;

  if (isError) {
    return (
      <SettingsError
        title="Failed to load workspace metrics"
        message={errorMessage ?? "Could not load organization statistics."}
        onRetry={onRetry}
      />
    );
  }

  const computed = computeSettingsStats(overview);

  const stats = [
    {
      label: "Human users",
      value: formatMetricValue(computed.totalUsers),
      detail: "Accounts in this organization",
      icon: Users,
      accent: "emerald" as const,
    },
    {
      label: "Departments",
      value: formatMetricValue(computed.totalDepartments),
      detail: "Top-level org units",
      icon: Building2,
      accent: "blue" as const,
    },
    {
      label: "Org teams",
      value: formatMetricValue(computed.totalTeams),
      detail: "Teams under departments",
      icon: Network,
      accent: "purple" as const,
    },
    {
      label: "Documents",
      value: formatMetricValue(computed.totalDocuments),
      detail: computed.overviewAvailable
        ? "Knowledge base documents"
        : "Metrics unavailable",
      icon: FileText,
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
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>{stat.detail}</p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
