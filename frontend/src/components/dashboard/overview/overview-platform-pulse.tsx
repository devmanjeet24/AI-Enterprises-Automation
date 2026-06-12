"use client";

import { Activity, Clock, Shield, Sparkles } from "lucide-react";

import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const pulseMetrics: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  accent: DashboardAccent;
}[] = [
  {
    icon: Activity,
    label: "System load",
    value: "34%",
    detail: "Healthy",
    accent: "emerald",
  },
  {
    icon: Clock,
    label: "Avg latency",
    value: "1.2s",
    detail: "−0.3s vs avg",
    accent: "blue",
  },
  {
    icon: Shield,
    label: "Compliance",
    value: "100%",
    detail: "All checks pass",
    accent: "purple",
  },
  {
    icon: Sparkles,
    label: "Knowledge index",
    value: "94%",
    detail: "12 docs pending",
    accent: "gold",
  },
];

export function OverviewPlatformPulse() {
  return (
    <DashboardCard variant="panel" accent="neutral" className="h-full" interactive={false}>
      <DashboardCardHeader title="Platform pulse" subtitle="Real-time health" />
      <div className="grid grid-cols-2 gap-3 p-4">
        {pulseMetrics.map((metric) => {
          const Icon = metric.icon;
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
                {metric.value}
              </p>
              <p className="mt-1.5 text-[11px] text-tertiary">{metric.detail}</p>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
