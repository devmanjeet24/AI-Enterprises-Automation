"use client";

import { Lightbulb, Lock } from "lucide-react";

import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import type { AnalyticsInsightItem } from "@/lib/analytics/types";
import type { DashboardAccent } from "@/lib/dashboard-accents";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface AnalyticsInsightsPanelProps {
  title?: string;
  subtitle?: string;
  insights: AnalyticsInsightItem[];
  accent?: DashboardAccent;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsInsightsPanel({
  title = "Summary insights",
  subtitle = "Highlights derived from your workspace data",
  insights,
  accent = "emerald",
  isLoading = false,
  emptyMessage = "Insights will appear once metrics are available.",
}: AnalyticsInsightsPanelProps) {
  const accentStyles = dashboardAccents[accent];

  return (
    <DashboardCard variant="panel" accent={accent} className="h-full" interactive={false}>
      <DashboardCardHeader title={title} subtitle={subtitle} accent={accent} />
      <div className="space-y-3 p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-white/[0.04]"
              />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <Lightbulb className={cn("mt-0.5 size-4 shrink-0", accentStyles.text)} />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {insight.text}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}

interface AnalyticsRestrictedPanelProps {
  title: string;
  message?: string;
}

export function AnalyticsRestrictedPanel({
  title,
  message = "You do not have permission to view this data block.",
}: AnalyticsRestrictedPanelProps) {
  return (
    <DashboardCard
      variant="panel"
      accent="neutral"
      interactive={false}
      className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center"
    >
      <Lock className="size-5 text-tertiary" />
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">{message}</p>
    </DashboardCard>
  );
}
