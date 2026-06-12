"use client";

import { ArrowUpRight, Minus } from "lucide-react";

import { overviewKpis } from "@/config/dashboard";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardSectionHeader } from "../dashboard-card";

export function OverviewKpiGrid() {
  return (
    <section className="px-6 md:px-8">
      <DashboardSectionHeader
        eyebrow="Performance"
        title="Key metrics"
        description="Platform-wide activity and efficiency at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewKpis.map((kpi) => {
          const accent = dashboardAccents[kpi.accent];
          return (
            <DashboardCard
              key={kpi.label}
              variant="kpi"
              accent={kpi.accent}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-muted-foreground">{kpi.label}</p>
                {kpi.trend === "up" ? (
                  <ArrowUpRight className={cn("size-4 shrink-0", accent.text)} />
                ) : (
                  <Minus className="size-4 shrink-0 text-tertiary" />
                )}
              </div>
              <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em] text-foreground">
                {kpi.value}
              </p>
              <p
                className={cn(
                  "mt-2 text-[12px]",
                  kpi.trend === "up" ? accent.textMuted : "text-tertiary",
                )}
              >
                {kpi.change}
              </p>
            </DashboardCard>
          );
        })}
      </div>
    </section>
  );
}
