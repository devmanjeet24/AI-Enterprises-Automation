"use client";

import { CheckCircle2, ClipboardList, FileText, Search } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeResearchStats } from "@/config/research-hub";
import type { ResearchAnalytics, ResearchProject } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ResearchHubStatsSkeleton } from "./research-hub-skeleton";

interface ResearchHubStatsProps {
  projects: ResearchProject[];
  analytics?: ResearchAnalytics | null;
  isLoading?: boolean;
}

export function ResearchHubStats({
  projects,
  analytics,
  isLoading = false,
}: ResearchHubStatsProps) {
  if (isLoading) return <ResearchHubStatsSkeleton />;

  const computed = computeResearchStats(projects, analytics);

  const stats = [
    {
      label: "Total projects",
      value: computed.total,
      detail: "Across your organization",
      icon: Search,
      accent: "purple" as const,
    },
    {
      label: "Active projects",
      value: computed.active,
      detail: `${computed.draft} in draft`,
      icon: CheckCircle2,
      accent: "emerald" as const,
    },
    {
      label: "Reports completed",
      value: computed.completedReports,
      detail: `${computed.totalReports} total reports`,
      icon: FileText,
      accent: "blue" as const,
    },
    {
      label: "Runs (7 days)",
      value: computed.recentRuns,
      detail: "Recent research executions",
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
