"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { formatDateTime, researchTemplateLabels } from "@/config/research-hub";
import type { EnrichedResearchReport } from "@/lib/analytics/compute/reports";
import type { ResearchTemplateType } from "@/lib/research-hub/types";

interface AnalyticsReportsTableProps {
  reports: EnrichedResearchReport[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsReportsTable({
  reports,
  isLoading = false,
  emptyMessage = "Research reports will appear here once projects are run.",
}: AnalyticsReportsTableProps) {
  return (
    <DashboardCard variant="panel" accent="gold" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Recent reports"
        subtitle="Latest research report outputs across projects"
        accent="gold"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Template</th>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
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
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <FileText className="mx-auto size-6 text-tertiary" />
                  <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/research-hub/${report.researchProjectId}`}
                      className="font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {report.projectName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {researchTemplateLabels[
                      report.templateLabel as ResearchTemplateType
                    ] ?? report.templateLabel}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    v{report.versionNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <TaskStatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {formatDateTime(report.createdAt)}
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
