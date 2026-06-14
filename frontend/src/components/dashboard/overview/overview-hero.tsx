"use client";

import { Bot, TrendingUp, Users, Workflow, Zap } from "lucide-react";

import type { OverviewPageData } from "@/hooks/use-dashboard-overview";
import { formatCount } from "@/lib/dashboard/overview";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const heroStatAccents = ["emerald", "blue", "purple", "gold"] as const;

const quickStatLabels = [
  { label: "Active agents", accent: "emerald" as const },
  { label: "Tasks completed", accent: "blue" as const },
  { label: "Knowledge coverage", accent: "purple" as const },
  { label: "Workflow success", accent: "gold" as const },
];

interface OverviewHeroProps {
  data: OverviewPageData;
}

function displayCount(value: number | undefined, isLoading?: boolean) {
  if (isLoading) return "—";
  return formatCount(value ?? 0);
}

export function OverviewHero({ data }: OverviewHeroProps) {
  const user = useAppSelector((state) => state.auth.user);
  const { overview, isLoading, quickStats } = data;

  const firstName = user?.first_name ?? "there";
  const orgName = user?.organization_name ?? "Your organization";

  const heroStats = [
    {
      icon: Bot,
      label: "Agents",
      value: displayCount(overview?.total_ai_employees, isLoading),
    },
    {
      icon: Users,
      label: "Members",
      value: displayCount(overview?.total_users, isLoading),
    },
    {
      icon: Workflow,
      label: "Workflows",
      value: displayCount(overview?.total_workflows, isLoading),
    },
    {
      icon: Zap,
      label: "Tasks",
      value: displayCount(overview?.total_agent_tasks, isLoading),
    },
  ] as const;

  const activeAgents = data.activeEmployeeCount;
  const totalTasks = overview?.total_agent_tasks ?? 0;
  const workflowSuccess = quickStats[3]?.value ?? 0;

  const displayedQuickStats =
    quickStats.length > 0
      ? quickStats
      : quickStatLabels.map((item) => ({ ...item, value: 0 }));

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            {orgName}
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Welcome in, <span className="text-[#f5c518]">{firstName}</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {isLoading
              ? "Loading workspace summary…"
              : `${activeAgents} agents active · ${formatCount(totalTasks)} agent tasks · ${workflowSuccess}% workflow success`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }, index) => {
            const accent = dashboardAccents[heroStatAccents[index]];
            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    accent.bgSubtle,
                    accent.border,
                  )}
                >
                  <Icon className={cn("size-4", accent.text)} />
                </div>
                <div>
                  <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                    {value}
                  </p>
                  <p className="mt-1 text-[12px] text-tertiary">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayedQuickStats.map((stat) => {
          const accent = dashboardAccents[stat.accent];
          return (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border bg-gradient-to-br from-white/[0.03] to-transparent px-4 py-3.5 backdrop-blur-sm",
                accent.border,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-muted-foreground">{stat.label}</span>
                <span className="flex items-center gap-1 text-[13px] font-medium text-foreground">
                  <TrendingUp className={cn("size-3.5", accent.text)} />
                  {isLoading ? "—" : `${stat.value}%`}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full", accent.bar)}
                  style={{ width: isLoading ? "0%" : `${stat.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
