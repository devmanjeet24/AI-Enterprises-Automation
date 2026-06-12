"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { getEmployeeInitials } from "@/config/ai-employees";
import type { AIEmployee } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { EmployeeStatusBadge } from "./employee-status-badge";

interface EmployeeCardProps {
  employee: AIEmployee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const accent = dashboardAccents.emerald;

  return (
    <Link href={`/ai-employees/${employee.id}`} className="block">
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
              {getEmployeeInitials(employee.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {employee.name}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {employee.role}
              </p>
            </div>
          </div>
          <EmployeeStatusBadge status={employee.status} />
        </div>

        {employee.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {employee.description}
          </p>
        )}

        <div className="mt-5 flex items-center border-t border-white/[0.06] pt-4">
          {employee.status === "active" ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-400">
              <MessageSquare className="size-3.5" />
              Active — open to configure & chat
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">
              Inactive — activate to enable chat
            </span>
          )}
        </div>
      </DashboardCard>
    </Link>
  );
}
