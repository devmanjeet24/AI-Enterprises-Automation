"use client";

import { Badge } from "@/components/ui/badge";
import { aiEmployeeStatus } from "@/config/dashboard";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DashboardCard, DashboardCardHeader } from "../dashboard-card";

const statusConfig = {
  active: { label: "Active", variant: "success" as const, accent: "emerald" as const },
  idle: { label: "Idle", variant: "warning" as const, accent: "gold" as const },
  offline: { label: "Off", variant: "outline" as const, accent: "neutral" as const },
};

const avatarAccents = ["emerald", "blue", "purple", "gold"] as const;

export function OverviewAiEmployees() {
  return (
    <DashboardCard variant="list" accent="emerald" className="flex h-full flex-col" interactive={false}>
      <DashboardCardHeader
        title="AI employees"
        subtitle={`${aiEmployeeStatus.filter((e) => e.status === "active").length} of ${aiEmployeeStatus.length} active`}
        accent="emerald"
      />
      <ul className="divide-y divide-white/[0.05]">
        {aiEmployeeStatus.map((employee, index) => {
          const status = statusConfig[employee.status];
          const avatarAccent = dashboardAccents[avatarAccents[index % avatarAccents.length]];
          const statusAccent = dashboardAccents[status.accent];

          return (
            <li
              key={employee.id}
              className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold",
                    avatarAccent.bgSubtle,
                    avatarAccent.border,
                    avatarAccent.text,
                  )}
                >
                  {employee.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0c1220]",
                    statusAccent.dot,
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {employee.name}
                  </p>
                  <Badge variant={status.variant} className="h-[18px] px-1.5 text-[10px]">
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {employee.role}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-medium tabular-nums text-foreground">
                  {employee.tasksToday}
                </p>
                <p className="text-[11px] text-tertiary">tasks</p>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
