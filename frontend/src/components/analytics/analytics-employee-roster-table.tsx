"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

import { EmployeeStatusBadge } from "@/components/ai-employees/employee-status-badge";
import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import type { AIEmployeeAnalyticsRow } from "@/lib/analytics/compute/ai-employees";

interface AnalyticsEmployeeRosterTableProps {
  rows: AIEmployeeAnalyticsRow[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsEmployeeRosterTable({
  rows,
  isLoading = false,
  emptyMessage = "AI employee roster metrics will appear here.",
}: AnalyticsEmployeeRosterTableProps) {
  return (
    <DashboardCard variant="panel" accent="emerald" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Agent roster"
        subtitle="Knowledge, tools, and conversation counts per agent"
        accent="emerald"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Agent</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Knowledge</th>
              <th className="px-5 py-3 font-medium">Tools</th>
              <th className="px-5 py-3 font-medium">Chats</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3].map((index) => (
                <tr key={index} className="border-b border-white/[0.04]">
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <Bot className="mx-auto size-6 text-tertiary" />
                  <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.employeeId}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/ai-employees/${row.employeeId}`}
                      className="font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {row.employeeName}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-tertiary">{row.role}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <EmployeeStatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {row.knowledgeCount}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {row.enabledToolCount}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {row.conversationCount}
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
