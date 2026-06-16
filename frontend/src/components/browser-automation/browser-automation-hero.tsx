"use client";

import { CheckCircle2, Globe, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeBrowserStats } from "@/config/browser-automation";
import type {
  BrowserAnalytics,
  BrowserProfile,
  BrowserTask,
} from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserAutomationHeroProps {
  profiles: BrowserProfile[];
  tasks: BrowserTask[];
  analytics?: BrowserAnalytics | null;
  analyticsAvailable?: boolean;
  canCreateProfile?: boolean;
  canCreateTask?: boolean;
  onCreateProfileClick: () => void;
  onCreateTaskClick: () => void;
}

export function BrowserAutomationHero({
  profiles,
  tasks,
  analytics,
  analyticsAvailable = Boolean(analytics),
  canCreateProfile = true,
  canCreateTask = true,
  onCreateProfileClick,
  onCreateTaskClick,
}: BrowserAutomationHeroProps) {
  const accent = dashboardAccents.blue;
  const stats = computeBrowserStats(profiles, tasks, analytics);

  const heroStats = [
    { icon: Globe, label: "Profiles", value: stats.totalProfiles },
    { icon: CheckCircle2, label: "Ready tasks", value: stats.readyTasks },
    {
      icon: Layers,
      label: "Executions (7d)",
      value: analyticsAvailable ? stats.recentExecutions : null,
    },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Browser Automation
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Web tasks with{" "}
            <span className={accent.text}>managed profiles</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Configure persistent browser profiles, define automation tasks with target URLs
            and instructions, and track execution history across your organization.
          </p>
          <p className="mt-2 text-[12px] text-tertiary">
            Runs use Playwright with headless Chromium to open real pages and extract live content.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }) => (
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
                  {value == null ? "—" : value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {canCreateTask && (
          <Button variant="brand" size="sm" onClick={onCreateTaskClick}>
            <Plus className="size-3.5" />
            Create task
          </Button>
        )}
        {canCreateProfile && (
          <Button variant="secondary" size="sm" onClick={onCreateProfileClick}>
            <Plus className="size-3.5" />
            Create profile
          </Button>
        )}
        <p className="text-[12px] text-tertiary">Profile → Task → Mark ready → Run</p>
      </div>
    </section>
  );
}
