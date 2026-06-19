"use client";

import { ArrowRight, Mail, Shield, Users } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatRelativeDate,
  getUserDisplayName,
  getUserInitials,
} from "@/config/users";
import type { User } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { UserStatusBadge } from "./user-status-badge";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const accent = dashboardAccents.emerald;
  const displayName = getUserDisplayName(user);

  return (
    <Link href={`/settings/users/${user.id}`} className="block">
      <DashboardCard variant="default" accent="emerald" className="h-full p-5">
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
              {getUserInitials(user)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {displayName}
              </h3>
              <p className="mt-0.5 truncate text-[12px] text-tertiary">{user.email}</p>
            </div>
          </div>
          <UserStatusBadge isActive={user.is_active} />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {(user.roles ?? []).length > 0 ? (
            (user.roles ?? []).map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <Shield className="size-2.5" />
                {role.name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-tertiary">No roles assigned</span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Mail className="size-3.5" />
              {(user.roles ?? []).length} role{(user.roles ?? []).length === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(user.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <Users className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
