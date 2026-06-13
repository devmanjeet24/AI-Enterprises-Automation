"use client";

import { CheckCircle2, Globe, Layers, Play } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeBrowserStats } from "@/config/browser-automation";
import type {
  BrowserAnalytics,
  BrowserProfile,
  BrowserTask,
} from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserAutomationError } from "./browser-automation-error";
import { BrowserAutomationStatsSkeleton } from "./browser-automation-skeleton";

interface BrowserAutomationStatsProps {
  profiles: BrowserProfile[];
  tasks: BrowserTask[];
  analytics?: BrowserAnalytics | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function formatMetricValue(value: number | null): string {
  return value == null ? "—" : String(value);
}

export function BrowserAutomationStats({
  profiles,
  tasks,
  analytics,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: BrowserAutomationStatsProps) {
  if (isLoading) return <BrowserAutomationStatsSkeleton />;

  if (isError) {
    return (
      <BrowserAutomationError
        title="Failed to load browser analytics"
        message={errorMessage ?? "Could not load automation metrics."}
        onRetry={onRetry}
      />
    );
  }

  const computed = computeBrowserStats(profiles, tasks, analytics);

  const stats = [
    {
      label: "Browser profiles",
      value: formatMetricValue(computed.totalProfiles),
      detail: `${computed.activeProfiles} active`,
      icon: Globe,
      accent: "blue" as const,
    },
    {
      label: "Automation tasks",
      value: formatMetricValue(computed.totalTasks),
      detail: `${computed.readyTasks} ready to run`,
      icon: Layers,
      accent: "purple" as const,
    },
    {
      label: "Executions completed",
      value: formatMetricValue(computed.completedExecutions),
      detail: computed.analyticsAvailable
        ? `${computed.totalExecutions} total runs`
        : "Analytics unavailable",
      icon: CheckCircle2,
      accent: "emerald" as const,
    },
    {
      label: "Runs (7 days)",
      value: formatMetricValue(computed.recentExecutions),
      detail: computed.analyticsAvailable
        ? "Recent browser executions"
        : "Analytics unavailable",
      icon: Play,
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
