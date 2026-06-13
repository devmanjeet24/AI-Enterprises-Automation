"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  formatPermissionAction,
  getPermissionResource,
  getResourceLabel,
} from "@/config/permissions";
import { isSeededPermission } from "@/lib/permissions/guards";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { PermissionStatusBadge } from "./permission-status-badge";
import { SeededPermissionBadge } from "./seeded-permission-badge";

interface PermissionHeaderProps {
  permission: Permission;
  linkedRoleCount?: number;
  actions?: React.ReactNode;
}

export function PermissionHeader({
  permission,
  linkedRoleCount = 0,
  actions,
}: PermissionHeaderProps) {
  const accent = dashboardAccents.purple;
  const resource = getPermissionResource(permission.slug);
  const action = permission.slug.split(":")[1] ?? "";
  const isSeeded = isSeededPermission(permission.slug);

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/settings/permissions">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Permissions
        </Button>
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <span className={cn("font-mono text-[11px] font-semibold", accent.text)}>RB</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Permission
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {permission.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
              {permission.slug}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PermissionStatusBadge isActive={permission.is_active} />
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
              {isSeeded ? <SeededPermissionBadge /> : (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Custom
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {linkedRoleCount} linked role{linkedRoleCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
