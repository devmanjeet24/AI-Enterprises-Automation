"use client";

import { CheckCircle2, ClipboardList, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeResearchStats } from "@/config/research-hub";
import type { ResearchAnalytics, ResearchProject } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface ResearchHubHeroProps {
  projects: ResearchProject[];
  analytics?: ResearchAnalytics | null;
  canCreate?: boolean;
  onCreateClick: () => void;
}

export function ResearchHubHero({
  projects,
  analytics,
  canCreate = true,
  onCreateClick,
}: ResearchHubHeroProps) {
  const accent = dashboardAccents.purple;
  const stats = computeResearchStats(projects, analytics);

  const heroStats = [
    { icon: Search, label: "Total projects", value: stats.total },
    { icon: CheckCircle2, label: "Active", value: stats.active },
    { icon: ClipboardList, label: "Reports", value: stats.completedReports },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Research Hub
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Run structured{" "}
            <span className={accent.text}>AI research projects</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Define research briefs, pick methodology templates, assign agent teams,
            and generate versioned reports with full execution history.
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
                  {value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {canCreate && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create project
          </Button>
        )}
        <p className="text-[12px] text-tertiary">
          Brief → Template → Agent team → Run research
        </p>
      </div>
    </section>
  );
}
