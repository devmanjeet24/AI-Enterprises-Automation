"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { AnalyticsKpiItem } from "@/lib/analytics/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AnalyticsError } from "./analytics-error";
import { AnalyticsKpiSkeleton } from "./analytics-skeleton";

interface AnalyticsKpiGridProps {
  items: AnalyticsKpiItem[];
  icons?: LucideIcon[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function AnalyticsKpiGrid({
  items,
  icons,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: AnalyticsKpiGridProps) {
  if (isLoading) return <AnalyticsKpiSkeleton />;

  if (isError) {
    return (
      <AnalyticsError
        title="Failed to load metrics"
        message={errorMessage ?? "Could not load analytics data."}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const statAccent = dashboardAccents[item.accent];
        const Icon = icons?.[index] ?? BarChart3;

        return (
          <DashboardCard
            key={item.label}
            variant="kpi"
            accent={item.accent}
            interactive={false}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">{item.label}</p>
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
              {item.value}
            </p>
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>{item.detail}</p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
