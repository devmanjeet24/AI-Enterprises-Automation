"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { useAgentTeamsOverview } from "@/hooks/use-agent-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AgentTeamsError } from "./agent-teams-error";
import { AgentTeamsHero } from "./agent-teams-hero";
import { AgentTeamsStats } from "./agent-teams-stats";
import { CreateTeamModal } from "./create-team-modal";
import { TeamCardGrid } from "./team-card-grid";
import { TeamEmptyState } from "./team-empty-state";
import { TeamCardGridSkeleton } from "./team-list-skeleton";

type StatusFilter = "all" | "active" | "inactive";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function AgentTeamsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const accent = dashboardAccents.blue;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.AGENT_TEAMS_WRITE);

  const { teams, details, tasks, isLoading, isError, error, refetch } =
    useAgentTeamsOverview();

  const filteredTeams = useMemo(() => {
    if (statusFilter === "all") return teams;
    if (statusFilter === "active") return teams.filter((team) => team.is_active);
    return teams.filter((team) => !team.is_active);
  }, [teams, statusFilter]);

  const errorMessage = isError
    ? getApiErrorMessage(error, "Failed to load agent teams.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <AgentTeamsHero
        teams={teams}
        details={details}
        tasks={tasks}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Collaboration"
            title="Team overview"
            description="Monitor active teams, member coverage, and task completion across your organization."
          />
          <AgentTeamsStats
            teams={teams}
            details={details}
            tasks={tasks}
            isLoading={isLoading}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Studio"
            title="Your agent teams"
            description="Configure multi-agent pipelines and run sequential tasks."
          />

          {isLoading ? (
            <TeamCardGridSkeleton />
          ) : isError ? (
            <AgentTeamsError
              title="Failed to load teams"
              message={errorMessage!}
              onRetry={() => refetch()}
            />
          ) : teams.length === 0 ? (
            <TeamEmptyState
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
              <TeamCardGrid teams={filteredTeams} details={details} />
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
