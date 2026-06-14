"use client";

import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { percentOf } from "@/config/analytics";
import type { AnalyticsChartSegment } from "@/lib/analytics/types";
import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AnalyticsChartSkeleton } from "./analytics-skeleton";

interface AnalyticsBarChartProps {
  title: string;
  subtitle?: string;
  segments: AnalyticsChartSegment[];
  accent?: DashboardAccent;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsBarChart({
  title,
  subtitle,
  segments,
  accent = "emerald",
  isLoading = false,
  emptyMessage = "No data available yet.",
}: AnalyticsBarChartProps) {
  if (isLoading) return <AnalyticsChartSkeleton />;

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <DashboardCard variant="panel" accent={accent} className="h-full" interactive={false}>
      <DashboardCardHeader title={title} subtitle={subtitle} accent={accent} />
      <div className="space-y-4 p-5">
        {segments.length === 0 || total === 0 ? (
          <div className="py-8 text-center text-[13px] text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          segments.map((segment) => {
            const segmentAccent = dashboardAccents[segment.accent];
            const width = percentOf(segment.value, total);

            return (
              <div key={segment.key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", segmentAccent.dot)} />
                    <span className="truncate text-[13px] text-foreground">{segment.label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 tabular-nums">
                    <span className="text-[13px] font-medium text-foreground">
                      {segment.value.toLocaleString("en-US")}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{width}%</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", segmentAccent.bar)}
                    style={{ width: `${Math.max(width, segment.value > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}

interface AnalyticsDistributionChartProps extends AnalyticsBarChartProps {
  showTotal?: boolean;
}

export function AnalyticsDistributionChart({
  showTotal = true,
  segments,
  ...props
}: AnalyticsDistributionChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const subtitle =
    props.subtitle ??
    (showTotal && total > 0 ? `${total.toLocaleString("en-US")} total` : props.subtitle);

  return <AnalyticsBarChart {...props} segments={segments} subtitle={subtitle} />;
}
