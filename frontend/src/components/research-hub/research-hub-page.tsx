"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useResearchAnalytics,
  useResearchProjects,
} from "@/hooks/use-research-projects";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/research-hub/access";
import type { ResearchProjectStatus } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateProjectModal } from "./create-project-modal";
import { ResearchHubAccessDenied } from "./research-hub-access-denied";
import { ResearchHubEmptyState } from "./research-hub-empty-state";
import { ResearchHubError } from "./research-hub-error";
import { ResearchHubHero } from "./research-hub-hero";
import { ResearchHubOrgReports } from "./research-hub-org-reports";
import { ResearchHubSkeleton } from "./research-hub-skeleton";
import { ResearchHubStats } from "./research-hub-stats";
import { ResearchProjectCardGrid } from "./research-project-card-grid";

type StatusFilter = ResearchProjectStatus | "all";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function ResearchHubPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const accent = dashboardAccents.purple;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.RESEARCH_PROJECTS_WRITE);

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useResearchProjects();

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useResearchAnalytics();

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const projectsAccessDenied = isProjectsError && isAccessDeniedError(projectsError);
  const analyticsErrorMessage = isAnalyticsError
    ? getApiErrorMessage(analyticsError, "Failed to load research analytics.")
    : null;
  const projectsErrorMessage = isProjectsError
    ? getApiErrorMessage(projectsError, "Failed to load research projects.")
    : null;

  const handleRetryProjects = () => {
    void refetchProjects();
  };

  const handleRetryAnalytics = () => {
    void refetchAnalytics();
  };

  if (isLoadingProjects) {
    return (
      <div className="pb-10 md:pb-12">
        <ResearchHubSkeleton />
      </div>
    );
  }

  if (projectsAccessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <ResearchHubAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <ResearchHubHero
        projects={projects}
        analytics={analytics}
        analyticsAvailable={!isAnalyticsError && Boolean(analytics)}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Portfolio"
            title="Research overview"
            description="Track active projects, report completion, and recent research activity across your organization."
          />
          <ResearchHubStats
            projects={projects}
            analytics={isAnalyticsError ? undefined : analytics}
            isLoading={isLoadingAnalytics}
            isError={isAnalyticsError}
            errorMessage={analyticsErrorMessage}
            onRetry={handleRetryAnalytics}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Reports"
            title="Organization reports"
            description="Browse versioned research outputs across all projects. Filter by status or project, then open a report or jump to its project."
          />
          <ResearchHubOrgReports
            projects={projects}
            projectsLoading={isLoadingProjects}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Projects"
            title="Your research projects"
            description="Define briefs, pick methodology templates, and run structured research with agent teams."
          />

          {isProjectsError ? (
            <ResearchHubError
              title="Failed to load research projects"
              message={projectsErrorMessage!}
              onRetry={handleRetryProjects}
            />
          ) : projects.length === 0 ? (
            <ResearchHubEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
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
              <ResearchProjectCardGrid projects={filteredProjects} />
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
