"use client";

import { ArrowRight, Building2, Network } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatRelativeDate,
  getDepartmentInitials,
} from "@/config/departments";
import type { Department } from "@/lib/departments/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DepartmentStatusBadge } from "./department-status-badge";

interface DepartmentCardProps {
  department: Department;
  teamCount?: number;
}

export function DepartmentCard({ department, teamCount = 0 }: DepartmentCardProps) {
  const accent = dashboardAccents.blue;

  return (
    <Link href={`/settings/departments/${department.id}`} className="block">
      <DashboardCard variant="default" accent="blue" className="h-full p-5">
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
              {getDepartmentInitials(department.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {department.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {department.slug}
              </p>
            </div>
          </div>
          <DepartmentStatusBadge isActive={department.is_active} />
        </div>

        {department.description ? (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {department.description}
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-tertiary">No description</p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Network className="size-3.5" />
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(department.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <Building2 className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
