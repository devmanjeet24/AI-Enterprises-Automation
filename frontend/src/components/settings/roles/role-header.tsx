"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getRoleInitials, SYSTEM_ROLE_SLUGS } from "@/config/roles";
import type { RoleDetail } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { RoleStatusBadge } from "./role-status-badge";
import { SystemRoleBadge } from "./system-role-badge";

interface RoleHeaderProps {
  role: RoleDetail;
  actions?: React.ReactNode;
}

export function RoleHeader({ role, actions }: RoleHeaderProps) {
  const accent = dashboardAccents.purple;
  const isSystem = SYSTEM_ROLE_SLUGS.has(role.slug);
  const permissionCount = role.permissions.length;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/settings/roles">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Roles
        </Button>
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
              accent.bgSubtle,
              accent.border,
              accent.text,
            )}
          >
            {getRoleInitials(role.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Role
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {role.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
              {role.slug}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleStatusBadge isActive={role.is_active} />
              {isSystem && <SystemRoleBadge />}
              {!isSystem && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Custom
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {permissionCount} permission{permissionCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
