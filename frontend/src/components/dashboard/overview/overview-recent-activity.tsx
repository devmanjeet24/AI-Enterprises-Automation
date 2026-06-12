"use client";

import {
  BookOpen,
  Bot,
  GitBranch,
  Globe,
  Search,
} from "lucide-react";

import type { OverviewActivityItem } from "@/lib/dashboard/types";
import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const activityIcons = {
  agent: Bot,
  workflow: GitBranch,
  knowledge: BookOpen,
  research: Search,
  browser: Globe,
} as const;

const activityAccents: Record<keyof typeof activityIcons, DashboardAccent> = {
  agent: "emerald",
  workflow: "blue",
  knowledge: "purple",
  research: "purple",
  browser: "neutral",
};

const VISIBLE_COUNT = 4;

interface OverviewRecentActivityProps {
  activity: OverviewActivityItem[];
  activityTodayCount: number;
  isLoading?: boolean;
}

export function OverviewRecentActivity({
  activity,
  activityTodayCount,
  isLoading,
}: OverviewRecentActivityProps) {
  const items = activity.slice(0, VISIBLE_COUNT);

  return (
    <DashboardCard variant="list" accent="blue" className="flex h-full flex-col" interactive={false}>
      <DashboardCardHeader
        title="Recent activity"
        subtitle={
          isLoading
            ? "Loading activity…"
            : `${activityTodayCount} event${activityTodayCount === 1 ? "" : "s"} today`
        }
        action={{ label: "View all" }}
        accent="blue"
      />
      <ul className="flex-1 divide-y divide-white/[0.05]">
        {items.length === 0 && !isLoading ? (
          <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">
            No recent activity yet.
          </li>
        ) : (
          items.map((item) => {
            const Icon = activityIcons[item.type];
            const accent = dashboardAccents[activityAccents[item.type]];
            return (
              <li
                key={item.id}
                className="group flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    accent.bgSubtle,
                    accent.border,
                  )}
                >
                  <Icon className={cn("size-4", accent.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {item.title}
                    </p>
                    <time className="shrink-0 text-[11px] text-tertiary">{item.time}</time>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </DashboardCard>
  );
}
