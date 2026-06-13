"use client";

import { CircleOff, KeyRound, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computePermissionsStats } from "@/config/permissions";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface PermissionsHeroProps {
  permissions: Permission[];
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function PermissionsHero({
  permissions,
  canCreate = false,
  onCreateClick,
}: PermissionsHeroProps) {
  const accent = dashboardAccents.purple;
  const stats = computePermissionsStats(permissions);

  const heroStats = [
    { icon: KeyRound, label: "Total", value: stats.total },
    { icon: Layers, label: "Resources", value: stats.resourcesCovered },
    { icon: KeyRound, label: "Custom", value: stats.custom },
    { icon: CircleOff, label: "Active", value: stats.active },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Settings · Permissions
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Manage the <span className={accent.text}>permission catalog</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Browse and maintain permission definitions. Grant permissions to roles from the
            Roles settings section.
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
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create permission
          </Button>
          <p className="text-[12px] text-tertiary">
            Permission catalog → Role grants → User access
          </p>
        </div>
      )}
    </section>
  );
}
