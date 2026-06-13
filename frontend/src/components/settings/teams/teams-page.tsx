"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  filterTeamsByDepartment,
  filterTeamsByStatus,
} from "@/config/teams";
import { useDepartments } from "@/hooks/use-departments";
import { useTeams } from "@/hooks/use-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { getCreateTeamBlockedMessage } from "@/lib/teams/guards";
import { isAccessDeniedError } from "@/lib/teams/access";
import type { TeamStatusFilter } from "@/lib/teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateTeamModal } from "./create-team-modal";
import { TeamCardGrid } from "./team-card-grid";
import { TeamsAccessDenied } from "./teams-access-denied";
import { TeamsEmptyState } from "./teams-empty-state";
import { TeamsError } from "./teams-error";
import { TeamsHero } from "./teams-hero";
import { TeamsSkeleton } from "./teams-skeleton";
import { TeamsStats } from "./teams-stats";

const statusFilters: { value: TeamStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function TeamsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const accent = dashboardAccents.blue;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.TEAMS_WRITE);

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isError: isTeamsError,
    error: teamsError,
    refetch: refetchTeams,
  } = useTeams();

  const { data: departments = [] } = useDepartments();

  const createBlockedMessage = getCreateTeamBlockedMessage(departments);

  const filteredTeams = useMemo(() => {
    const byStatus = filterTeamsByStatus(teams, statusFilter);
    return filterTeamsByDepartment(byStatus, departmentFilter);
  }, [teams, statusFilter, departmentFilter]);

  const accessDenied = isTeamsError && isAccessDeniedError(teamsError);
  const errorMessage = isTeamsError
    ? getApiErrorMessage(teamsError, "Failed to load teams.")
    : null;

  if (isTeamsLoading) {
    return <TeamsSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <TeamsAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <TeamsHero
        teams={teams}
        departmentCount={departments.length}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
        createBlockedMessage={createBlockedMessage}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Structure"
            title="Team overview"
            description="Monitor active org teams and how they map to departments."
          />
          <TeamsStats teams={teams} departmentCount={departments.length} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Directory"
            title="Organization teams"
            description="Open a team to edit its profile, reassign departments, or change status."
          />

          {isTeamsError ? (
            <TeamsError
              title="Failed to load teams"
              message={errorMessage!}
              onRetry={() => refetchTeams()}
            />
          ) : teams.length === 0 ? (
            <TeamsEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
              blockedMessage={createBlockedMessage}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className={cn(
                    "h-9 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[12px] font-medium text-muted-foreground transition-colors",
                    "hover:border-white/[0.12] hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  )}
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <TeamCardGrid teams={filteredTeams} departments={departments} />
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
