"use client";

import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatDuration,
} from "@/config/research-hub";
import type { ResearchReportSummary } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ResearchReportViewerModal } from "./research-report-viewer-modal";

interface ResearchProjectReportsProps {
  projectId: string;
  reports: ResearchReportSummary[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function ResearchProjectReports({
  projectId,
  reports,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: ResearchProjectReportsProps) {
  const accent = dashboardAccents.purple;
  const [selectedReport, setSelectedReport] = useState<ResearchReportSummary | null>(
    null,
  );

  const sortedReports = [...reports].sort(
    (a, b) => b.version_number - a.version_number,
  );

  if (isLoading) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" />
        Loading reports…
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-12 text-center"
      >
        <p className="text-[15px] font-medium text-foreground">Failed to load reports</p>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          {errorMessage ?? "Could not load project reports."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[13px] font-medium text-brand hover:underline"
          >
            Try again
          </button>
        )}
      </DashboardCard>
    );
  }

  if (sortedReports.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <FileText className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">No reports yet</h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Run research on this project to generate versioned reports. Each run creates
          a new report version.
        </p>
      </DashboardCard>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedReports.map((report) => {
          const duration = formatDuration(report.started_at, report.completed_at);

          return (
            <DashboardCard
              key={report.id}
              variant="panel"
              accent="purple"
              interactive={false}
              className="p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-medium text-foreground">
                      Version {report.version_number}
                    </p>
                    <TaskStatusBadge status={report.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-tertiary">
                    <span>Created {formatDateTime(report.created_at)}</span>
                    {duration && <span>Duration: {duration}</span>}
                    {report.final_output && (
                      <span className="text-emerald-400">Output available</span>
                    )}
                  </div>
                  {report.final_output && (
                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {report.final_output}
                    </p>
                  )}
                  {report.error_message && (
                    <p className="mt-2 text-[12px] text-destructive">
                      {report.error_message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                    accent.border,
                    accent.bgSubtle,
                    accent.text,
                    "hover:bg-[#A78BFA]/10",
                  )}
                >
                  Open report
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      <ResearchReportViewerModal
        projectId={projectId}
        reportSummary={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  );
}
