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
import type { ResearchProjectStatus } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateProjectModal } from "./create-project-modal";
import { ResearchHubEmptyState } from "./research-hub-empty-state";
import { ResearchHubError } from "./research-hub-error";
import { ResearchHubHero } from "./research-hub-hero";
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
    refetch: refetchAnalytics,
  } = useResearchAnalytics();

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const errorMessage = isProjectsError
    ? getApiErrorMessage(projectsError, "Failed to load research projects.")
    : null;

  const handleRetry = () => {
    void refetchProjects();
    void refetchAnalytics();
  };

  return (
    <div className="pb-10 md:pb-12">
      <ResearchHubHero
        projects={projects}
        analytics={analytics}
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
            analytics={analytics}
            isLoading={isLoadingAnalytics}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Projects"
            title="Your research projects"
            description="Define briefs, pick methodology templates, and run structured research with agent teams."
          />

          {isLoadingProjects ? (
            <ResearchHubSkeleton />
          ) : isProjectsError ? (
            <ResearchHubError
              title="Failed to load research projects"
              message={errorMessage!}
              onRetry={handleRetry}
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
