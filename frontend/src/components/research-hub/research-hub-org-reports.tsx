"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatDuration,
  researchTemplateLabels,
} from "@/config/research-hub";
import { useResearchReports } from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AgentTaskStatus } from "@/lib/agent-teams/types";
import { isAccessDeniedError } from "@/lib/research-hub/access";
import type { ResearchProject, ResearchReportSummary } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ResearchHubAccessDenied } from "./research-hub-access-denied";
import { ResearchHubError } from "./research-hub-error";
import { ResearchReportViewerModal } from "./research-report-viewer-modal";

type ReportStatusFilter = AgentTaskStatus | "all";

const statusFilters: { value: ReportStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const ORG_REPORTS_LIMIT = 100;

interface EnrichedReport extends ResearchReportSummary {
  projectName: string;
  templateLabel: string;
}

function enrichReports(
  reports: ResearchReportSummary[],
  projects: ResearchProject[],
): EnrichedReport[] {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  return reports.map((report) => {
    const project = projectById.get(report.research_project_id);
    return {
      ...report,
      projectName: project?.name ?? "Unknown project",
      templateLabel: project
        ? researchTemplateLabels[project.template_type]
        : "Research report",
    };
  });
}

interface ResearchHubOrgReportsProps {
  projects: ResearchProject[];
  projectsLoading?: boolean;
}

export function ResearchHubOrgReports({
  projects,
  projectsLoading = false,
}: ResearchHubOrgReportsProps) {
  const accent = dashboardAccents.purple;
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<EnrichedReport | null>(null);

  const reportParams = useMemo(
    () => ({
      ...(projectFilter !== "all" ? { project_id: projectFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      limit: ORG_REPORTS_LIMIT,
    }),
    [projectFilter, statusFilter],
  );

  const {
    data: reports = [],
    isLoading: isLoadingReports,
    isError: isReportsError,
    error: reportsError,
    refetch: refetchReports,
  } = useResearchReports(reportParams);

  const enrichedReports = useMemo(
    () => enrichReports(reports, projects),
    [reports, projects],
  );

  const isLoading = projectsLoading || isLoadingReports;
  const reportsAccessDenied = isReportsError && isAccessDeniedError(reportsError);
  const reportsErrorMessage = isReportsError
    ? getApiErrorMessage(reportsError, "Could not load organization reports.")
    : null;

  if (reportsAccessDenied) {
    return (
      <ResearchHubAccessDenied
        title="Reports access restricted"
        message="You do not have permission to view research reports across your organization."
      />
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                statusFilter === filter.value
                  ? cn(accent.bgSubtle, accent.border, accent.text)
                  : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 sm:min-w-[220px]">
          <label htmlFor="org-reports-project-filter" className="text-[11px] text-tertiary">
            Project
          </label>
          <select
            id="org-reports-project-filter"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            disabled={projectsLoading || projects.length === 0}
            className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-foreground outline-none transition-colors focus:border-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <DashboardCard
          variant="panel"
          accent="purple"
          interactive={false}
          className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" />
          Loading organization reports…
        </DashboardCard>
      ) : isReportsError ? (
        <ResearchHubError
          title="Failed to load organization reports"
          message={reportsErrorMessage!}
          onRetry={() => {
            void refetchReports();
          }}
        />
      ) : enrichedReports.length === 0 ? (
        <DashboardCard
          variant="panel"
          accent="purple"
          interactive={false}
          className="flex flex-col items-center px-6 py-16 text-center"
        >
          <FileText className="size-8 text-tertiary" />
          <h3 className="mt-4 text-[15px] font-medium text-foreground">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "No reports match your filters"
              : "No research reports yet"}
          </h3>
          <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
            {statusFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting the status or project filters to see more results."
              : "Run research on a project to generate versioned reports. Completed runs appear here across your organization."}
          </p>
        </DashboardCard>
      ) : (
        <>
          <p className="mb-4 text-[12px] text-tertiary">
            Showing {enrichedReports.length} report
            {enrichedReports.length === 1 ? "" : "s"}
            {reports.length >= ORG_REPORTS_LIMIT
              ? ` (latest ${ORG_REPORTS_LIMIT} across your organization)`
              : " across your organization"}
          </p>

          <div className="space-y-3">
            {enrichedReports.map((report) => {
              const duration = formatDuration(report.started_at, report.completed_at);

              return (
                <DashboardCard
                  key={report.id}
                  variant="panel"
                  accent="purple"
                  interactive={false}
                  className="p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/research-hub/${report.research_project_id}`}
                          className="truncate text-[15px] font-medium text-foreground transition-colors hover:text-brand"
                        >
                          {report.projectName}
                        </Link>
                        <TaskStatusBadge status={report.status} />
                      </div>

                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {report.templateLabel} · Version {report.version_number}
                      </p>

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

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/research-hub/${report.research_project_id}`}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
                          "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                        )}
                      >
                        View project
                        <ExternalLink className="size-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
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
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        </>
      )}

      <ResearchReportViewerModal
        projectId={selectedReport?.research_project_id ?? ""}
        reportSummary={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </>
  );
}
