"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getDepartmentInitials } from "@/config/departments";
import type { Department } from "@/lib/departments/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DepartmentStatusBadge } from "./department-status-badge";

interface DepartmentHeaderProps {
  department: Department;
  teamCount?: number;
  actions?: React.ReactNode;
}

export function DepartmentHeader({
  department,
  teamCount = 0,
  actions,
}: DepartmentHeaderProps) {
  const accent = dashboardAccents.blue;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/settings/departments">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Departments
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
            {getDepartmentInitials(department.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Department
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {department.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
              {department.slug}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DepartmentStatusBadge isActive={department.is_active} />
              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {teamCount} team{teamCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
