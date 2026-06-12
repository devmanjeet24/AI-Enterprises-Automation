"use client";

import {
  BookOpen,
  Bot,
  GitBranch,
  Globe,
  Search,
} from "lucide-react";

import { recentActivity } from "@/config/dashboard";
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

export function OverviewRecentActivity() {
  const items = recentActivity.slice(0, VISIBLE_COUNT);

  return (
    <DashboardCard variant="list" accent="blue" className="flex h-full flex-col" interactive={false}>
      <DashboardCardHeader
        title="Recent activity"
        subtitle={`${recentActivity.length} events today`}
        action={{ label: "View all" }}
        accent="blue"
      />
      <ul className="flex-1 divide-y divide-white/[0.05]">
        {items.map((item) => {
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
        })}
      </ul>
    </DashboardCard>
  );
}
