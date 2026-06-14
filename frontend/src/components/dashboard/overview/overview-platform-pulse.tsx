"use client";

import { Activity, Clock, Shield, Sparkles } from "lucide-react";

import type { OverviewPlatformMetric } from "@/lib/dashboard/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const metricIcons = [Activity, Clock, Shield, Sparkles] as const;

interface OverviewPlatformPulseProps {
  metrics: OverviewPlatformMetric[];
  isLoading?: boolean;
}

const loadingPulsePlaceholders: OverviewPlatformMetric[] = [
  { label: "Uptime", value: "—", detail: "Loading…", accent: "emerald" },
  { label: "Latency", value: "—", detail: "Loading…", accent: "blue" },
  { label: "Security", value: "—", detail: "Loading…", accent: "purple" },
  { label: "AI coverage", value: "—", detail: "Loading…", accent: "gold" },
];

export function OverviewPlatformPulse({
  metrics,
  isLoading,
}: OverviewPlatformPulseProps) {
  const displayMetrics =
    metrics.length > 0 ? metrics : isLoading ? loadingPulsePlaceholders : [];

  return (
    <DashboardCard variant="panel" accent="neutral" className="h-full" interactive={false}>
      <DashboardCardHeader title="Platform pulse" subtitle="Real-time health" />
      <div className="grid grid-cols-2 gap-3 p-4">
        {displayMetrics.map((metric, index) => {
          const Icon = metricIcons[index % metricIcons.length];
          const accent = dashboardAccents[metric.accent];
          return (
            <div
              key={metric.label}
              className={cn(
                "rounded-xl border bg-gradient-to-br from-white/[0.02] to-transparent p-3.5 transition-all duration-300",
                accent.border,
                accent.borderHover,
                "hover:bg-white/[0.02]",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("size-4", accent.text)} />
                <span className="text-[12px] text-muted-foreground">{metric.label}</span>
              </div>
              <p className="mt-2 font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                {isLoading ? "—" : metric.value}
              </p>
              <p className="mt-1.5 text-[11px] text-tertiary">{metric.detail}</p>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
