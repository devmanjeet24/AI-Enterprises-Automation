import type { DashboardOverview } from "@/lib/dashboard/types";
import type {
  ResearchAnalytics,
  ResearchProject,
  ResearchReportSummary,
} from "@/lib/research-hub/types";

import { countByField, countInLastDays, countWhere, percentOf } from "./utils";

export interface EnrichedResearchReport {
  id: string;
  researchProjectId: string;
  projectName: string;
  templateLabel: string;
  versionNumber: number;
  status: ResearchReportSummary["status"];
  createdAt: string;
  completedAt: string | null;
}

export interface ReportsAnalyticsMetrics {
  totalReports: number;
  completedReports: number;
  failedReports: number;
  inProgressReports: number;
  pendingReports: number;
  cancelledReports: number;
  completionRate: number;
  reportsByStatus: Record<string, number>;
  reportsLast7Days: number;
  reportsLast30Days: number;
  recentReports: EnrichedResearchReport[];
  researchProjectCount: number;
  researchAnalyticsAvailable: boolean;
  insights: string[];
}

export interface ReportsAnalyticsInput {
  overview?: DashboardOverview | null;
  reports?: ResearchReportSummary[] | null;
  projects?: ResearchProject[] | null;
  researchAnalytics?: ResearchAnalytics | null;
}

function buildInsights(
  metrics: Omit<ReportsAnalyticsMetrics, "insights">,
): string[] {
  const insights: string[] = [];

  if (metrics.totalReports === 0) {
    return [
      "Run research projects to generate reports. Research Hub is the only module with exportable report outputs today.",
    ];
  }

  insights.push(
    `${metrics.completedReports} of ${metrics.totalReports} reports completed (${metrics.completionRate}% success among finished runs).`,
  );

  if (metrics.failedReports > 0) {
    insights.push(
      `${metrics.failedReports} failed report${metrics.failedReports === 1 ? "" : "s"} may need a re-run.`,
    );
  }

  if (metrics.reportsLast7Days > 0) {
    insights.push(
      `${metrics.reportsLast7Days} report${metrics.reportsLast7Days === 1 ? "" : "s"} generated in the last 7 days.`,
    );
  }

  if (metrics.researchProjectCount > 0) {
    insights.push(
      `Reports span ${metrics.researchProjectCount} research project${metrics.researchProjectCount === 1 ? "" : "s"}.`,
    );
  }

  return insights.slice(0, 4);
}

export function computeReportsMetrics(
  input: ReportsAnalyticsInput,
): ReportsAnalyticsMetrics | null {
  const overview = input.overview;
  if (!overview) return null;

  const reports = input.reports ?? [];
  const projects = input.projects ?? [];
  const researchAnalytics = input.researchAnalytics;

  const projectById = new Map(projects.map((project) => [project.id, project]));

  const completedReports = countWhere(reports, (report) => report.status === "completed");
  const failedReports = countWhere(reports, (report) => report.status === "failed");
  const inProgressReports = countWhere(
    reports,
    (report) => report.status === "in_progress",
  );
  const pendingReports = countWhere(reports, (report) => report.status === "pending");
  const cancelledReports = countWhere(
    reports,
    (report) => report.status === "cancelled",
  );

  const finishedReports = completedReports + failedReports + cancelledReports;
  const completionRate = percentOf(completedReports, finishedReports);

  const recentReports: EnrichedResearchReport[] = [...reports]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 12)
    .map((report) => {
      const project = projectById.get(report.research_project_id);
      return {
        id: report.id,
        researchProjectId: report.research_project_id,
        projectName: project?.name ?? "Unknown project",
        templateLabel: project?.template_type ?? "research",
        versionNumber: report.version_number,
        status: report.status,
        createdAt: report.created_at,
        completedAt: report.completed_at,
      };
    });

  const totalReports =
    reports.length || researchAnalytics?.total_reports || 0;

  const baseMetrics = {
    totalReports,
    completedReports:
      completedReports || researchAnalytics?.completed_reports || 0,
    failedReports: failedReports || researchAnalytics?.failed_reports || 0,
    inProgressReports,
    pendingReports,
    cancelledReports,
    completionRate,
    reportsByStatus:
      reports.length > 0
        ? countByField(reports, (report) => report.status)
        : (researchAnalytics?.reports_by_status ?? {}),
    reportsLast7Days: countInLastDays(reports, 7),
    reportsLast30Days: countInLastDays(reports, 30),
    recentReports,
    researchProjectCount: projects.length || researchAnalytics?.total_projects || 0,
    researchAnalyticsAvailable: Boolean(researchAnalytics),
  };

  return {
    ...baseMetrics,
    insights: buildInsights(baseMetrics),
  };
}
