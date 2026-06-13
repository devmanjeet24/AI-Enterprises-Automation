"use client";

import { Building2, CircleOff, Network, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeTeamsStats } from "@/config/teams";
import type { Team } from "@/lib/teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface TeamsHeroProps {
  teams: Team[];
  departmentCount?: number;
  canCreate?: boolean;
  onCreateClick?: () => void;
  createBlockedMessage?: string | null;
}

export function TeamsHero({
  teams,
  departmentCount = 0,
  canCreate = false,
  onCreateClick,
  createBlockedMessage,
}: TeamsHeroProps) {
  const accent = dashboardAccents.blue;
  const stats = computeTeamsStats(teams);

  const heroStats = [
    { icon: Network, label: "Total teams", value: stats.total },
    { icon: Users, label: "Active", value: stats.active },
    { icon: CircleOff, label: "Inactive", value: stats.inactive },
    { icon: Building2, label: "Departments", value: departmentCount },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Settings · Org Teams
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Manage{" "}
            <span className={accent.text}>organizational teams</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Teams belong to departments and model your org structure. These are not
            Agent Teams used for multi-agent collaboration.
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

      {canCreate && onCreateClick && (
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            variant="brand"
            size="sm"
            onClick={onCreateClick}
            disabled={Boolean(createBlockedMessage)}
          >
            Create team
          </Button>
          <p className="text-[12px] text-tertiary">
            {createBlockedMessage ?? "Department → Team → Members (future)"}
          </p>
        </div>
      )}
    </section>
  );
}
