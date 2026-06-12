"use client";

import { Bot, BookOpen, MessageSquare, UserX } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeEmployeeStats } from "@/config/ai-employees";
import type { AIEmployee, AIEmployeeDetail } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { EmployeeStatsSkeleton } from "./employee-list-skeleton";

interface AiEmployeesStatsProps {
  employees: AIEmployee[];
  details?: AIEmployeeDetail[];
  isLoading?: boolean;
}

export function AiEmployeesStats({
  employees,
  details,
  isLoading = false,
}: AiEmployeesStatsProps) {
  if (isLoading) return <EmployeeStatsSkeleton />;

  const computed = computeEmployeeStats(employees, details);

  const stats = [
    {
      label: "Total employees",
      value: computed.total,
      detail: "Across your organization",
      icon: Bot,
      accent: "emerald" as const,
    },
    {
      label: "Active",
      value: computed.active,
      detail: "Available for chat",
      icon: MessageSquare,
      accent: "blue" as const,
    },
    {
      label: "With knowledge",
      value: computed.withKnowledge,
      detail: details ? "Documents assigned" : "View detail for counts",
      icon: BookOpen,
      accent: "purple" as const,
    },
    {
      label: "Inactive",
      value: computed.inactive,
      detail: "Not yet activated",
      icon: UserX,
      accent: "gold" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const statAccent = dashboardAccents[stat.accent];
        const Icon = stat.icon;
        return (
          <DashboardCard
            key={stat.label}
            variant="kpi"
            accent={stat.accent}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border",
                  statAccent.bgSubtle,
                  statAccent.border,
                )}
              >
                <Icon className={cn("size-3.5", statAccent.text)} />
              </div>
            </div>
            <p className="mt-3 font-display text-[2rem] leading-none tracking-[-0.02em] text-foreground">
              {stat.value}
            </p>
            <p className={cn("mt-2 text-[12px]", statAccent.textMuted)}>
              {stat.detail}
            </p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
