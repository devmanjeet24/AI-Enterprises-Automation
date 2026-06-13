"use client";

import { ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate, getRoleInitials, SYSTEM_ROLE_SLUGS } from "@/config/roles";
import type { Role } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { RoleStatusBadge } from "./role-status-badge";
import { SystemRoleBadge } from "./system-role-badge";

interface RoleCardProps {
  role: Role;
}

export function RoleCard({ role }: RoleCardProps) {
  const accent = dashboardAccents.purple;
  const isSystem = SYSTEM_ROLE_SLUGS.has(role.slug);

  return (
    <Link href={`/settings/roles/${role.id}`} className="block">
      <DashboardCard variant="default" accent="purple" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getRoleInitials(role.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {role.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {role.slug}
              </p>
            </div>
          </div>
          <RoleStatusBadge isActive={role.is_active} />
        </div>

        {role.description ? (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {role.description}
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-tertiary">No description</p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {isSystem && <SystemRoleBadge />}
              {!isSystem && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Custom
                </span>
              )}
            </div>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(role.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <Shield className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
