"use client";

import { Building2, Layers, Network, Users } from "lucide-react";

import { computeSettingsStats } from "@/config/settings";
import type { DashboardOverview } from "@/lib/dashboard/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface SettingsHeroProps {
  organizationName: string;
  overview?: DashboardOverview | null;
  isLoading?: boolean;
}

export function SettingsHero({
  organizationName,
  overview,
  isLoading = false,
}: SettingsHeroProps) {
  const accent = dashboardAccents.neutral;
  const stats = computeSettingsStats(overview);

  const heroStats = [
    { icon: Users, label: "Users", value: stats.totalUsers },
    { icon: Building2, label: "Departments", value: stats.totalDepartments },
    { icon: Network, label: "Org teams", value: stats.totalTeams },
    { icon: Layers, label: "Documents", value: stats.totalDocuments },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Settings
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Manage your{" "}
            <span className={accent.text}>organization</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Configure people, structure, roles, and access control for{" "}
            <span className="text-foreground">{organizationName}</span>.
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
                  {isLoading ? "—" : value == null ? "—" : value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
