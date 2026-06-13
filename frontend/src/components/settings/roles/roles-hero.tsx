"use client";

import { CircleOff, Plus, Shield, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeRolesStats } from "@/config/roles";
import type { Role } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface RolesHeroProps {
  roles: Role[];
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function RolesHero({ roles, canCreate = false, onCreateClick }: RolesHeroProps) {
  const accent = dashboardAccents.purple;
  const stats = computeRolesStats(roles);

  const heroStats = [
    { icon: Shield, label: "Total roles", value: stats.total },
    { icon: ShieldCheck, label: "System", value: stats.system },
    { icon: Shield, label: "Custom", value: stats.custom },
    { icon: CircleOff, label: "Active", value: stats.active },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Settings · Roles
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Manage <span className={accent.text}>access roles</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Define role bundles and control which permissions each role grants. Assign roles
            to users from the Users settings section.
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
            Create role
          </Button>
          <p className="text-[12px] text-tertiary">
            Role → Permissions → User assignments
          </p>
        </div>
      )}
    </section>
  );
}
