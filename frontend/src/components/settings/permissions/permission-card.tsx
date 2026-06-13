"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatPermissionAction,
  formatRelativeDate,
  getPermissionResource,
  getResourceLabel,
} from "@/config/permissions";
import { isSeededPermission } from "@/lib/permissions/guards";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { PermissionStatusBadge } from "./permission-status-badge";
import { SeededPermissionBadge } from "./seeded-permission-badge";

interface PermissionCardProps {
  permission: Permission;
}

export function PermissionCard({ permission }: PermissionCardProps) {
  const accent = dashboardAccents.purple;
  const resource = getPermissionResource(permission.slug);
  const action = permission.slug.split(":")[1] ?? "";
  const isSeeded = isSeededPermission(permission.slug);

  return (
    <Link href={`/settings/permissions/${permission.id}`} className="block">
      <DashboardCard variant="default" accent="purple" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <KeyRound className={cn("size-5", accent.text)} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {permission.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {permission.slug}
              </p>
            </div>
          </div>
          <PermissionStatusBadge isActive={permission.is_active} />
        </div>

        {permission.description ? (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {permission.description}
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-tertiary">No description</p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {resource && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {getResourceLabel(resource)}
                </span>
              )}
              {action && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {formatPermissionAction(action)}
                </span>
              )}
              {isSeeded ? (
                <SeededPermissionBadge />
              ) : (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Custom
                </span>
              )}
            </div>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(permission.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <KeyRound className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
