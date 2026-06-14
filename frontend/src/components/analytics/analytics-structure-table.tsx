"use client";

import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import type { OrganizationStructureRow } from "@/lib/analytics/compute/organization";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface AnalyticsStructureTableProps {
  rows: OrganizationStructureRow[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsStructureTable({
  rows,
  isLoading = false,
  emptyMessage = "Department structure will appear once departments are configured.",
}: AnalyticsStructureTableProps) {
  return (
    <DashboardCard variant="panel" accent="neutral" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Workspace structure"
        subtitle="Teams grouped by department"
        accent="neutral"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Teams</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2].map((index) => (
                <tr key={index} className="border-b border-white/[0.04]">
                  <td colSpan={3} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.departmentId}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {row.departmentName}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {row.teamCount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        row.isActive
                          ? cn(
                              dashboardAccents.emerald.border,
                              dashboardAccents.emerald.bgSubtle,
                              dashboardAccents.emerald.text,
                            )
                          : "border-white/[0.08] text-tertiary",
                      )}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
