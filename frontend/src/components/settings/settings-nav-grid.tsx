"use client";

import {
  ArrowRight,
  Building2,
  Clock,
  KeyRound,
  Lock,
  Network,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { settingsNavSections } from "@/config/settings";
import { dashboardAccents, type DashboardAccent } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

const sectionIcons: Record<(typeof settingsNavSections)[number]["id"], LucideIcon> = {
  organization: Building2,
  users: Users,
  departments: Building2,
  teams: Network,
  roles: Shield,
  permissions: KeyRound,
};

const sectionAccents: Record<(typeof settingsNavSections)[number]["id"], DashboardAccent> = {
  organization: "neutral",
  users: "emerald",
  departments: "blue",
  teams: "blue",
  roles: "purple",
  permissions: "purple",
};

export function SettingsNavGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {settingsNavSections.map((section) => {
        const Icon = sectionIcons[section.id];
        const accentKey = sectionAccents[section.id];
        const accent = dashboardAccents[accentKey];

        if (section.comingSoon) {
          return (
            <DashboardCard
              key={section.id}
              variant="default"
              accent={accentKey}
              interactive={false}
              className="h-full p-5 opacity-80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                      accent.bgSubtle,
                      accent.border,
                    )}
                  >
                    <Icon className={cn("size-5", accent.text)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-foreground">
                        {section.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-tertiary">
                        <Clock className="size-3" />
                        Coming soon
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <Lock className="size-4 shrink-0 text-tertiary" />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-[11px] text-tertiary">
                  {"comingSoonLabel" in section && typeof section.comingSoonLabel === "string"
                    ? section.comingSoonLabel
                    : "Coming soon"}
                </span>
              </div>
            </DashboardCard>
          );
        }

        return (
          <Link key={section.id} href={section.href} className="block">
            <DashboardCard variant="default" accent={accentKey} className="h-full p-5">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                    accent.bgSubtle,
                    accent.border,
                  )}
                >
                  <Icon className={cn("size-5", accent.text)} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end border-t border-white/[0.06] pt-4">
                <span
                  className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}
                >
                  Open
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </DashboardCard>
          </Link>
        );
      })}
    </div>
  );
}
