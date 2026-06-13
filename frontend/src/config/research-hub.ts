import type {
  ResearchAnalytics,
  ResearchProject,
  ResearchProjectStatus,
  ResearchTemplateType,
} from "@/lib/research-hub/types";

export type {
  CreateResearchProjectInput,
  ResearchAnalytics,
  ResearchProject,
  ResearchProjectDetail,
  ResearchProjectStatus,
  ResearchReport,
  ResearchReportSummary,
  ResearchTemplate,
  ResearchTemplateType,
  UpdateResearchProjectInput,
} from "@/lib/research-hub/types";

export const researchStatusLabels: Record<ResearchProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const researchTemplateLabels: Record<ResearchTemplateType, string> = {
  market_research: "Market Research",
  competitor_analysis: "Competitor Analysis",
  industry_analysis: "Industry Analysis",
  swot_analysis: "SWOT Analysis",
};

export function getProjectInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
): string | null {
  if (!startedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));

  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function computeResearchStats(
  projects: ResearchProject[],
  analytics?: ResearchAnalytics | null,
) {
  if (analytics) {
    return {
      total: analytics.total_projects,
      active: analytics.active_projects,
      draft: analytics.projects_by_status.draft ?? 0,
      archived: analytics.projects_by_status.archived ?? 0,
      totalReports: analytics.total_reports,
      completedReports: analytics.completed_reports,
      recentRuns: analytics.recent_runs_7d,
      reportsAvailable: true as const,
    };
  }

  const activeProjects = projects.filter(
    (project) => project.status === "active" && project.is_active,
  ).length;

  return {
    total: projects.length,
    active: activeProjects,
    draft: projects.filter((project) => project.status === "draft").length,
    archived: projects.filter((project) => project.status === "archived").length,
    totalReports: null,
    completedReports: null,
    recentRuns: null,
    reportsAvailable: false as const,
  };
}
