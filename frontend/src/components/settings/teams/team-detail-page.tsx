"use client";

import { notFound } from "next/navigation";

import { useDepartments } from "@/hooks/use-departments";
import { useTeam } from "@/hooks/use-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/teams/access";

import { TeamActions } from "./team-actions";
import { TeamConfigPanel } from "./team-config-panel";
import { TeamHeader } from "./team-header";
import { TeamsAccessDenied } from "./teams-access-denied";
import { TeamsError } from "./teams-error";
import { TeamDetailSkeleton } from "./teams-skeleton";

interface TeamDetailPageProps {
  teamId: string;
}

export function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.TEAMS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.TEAMS_DELETE);

  const {
    data: team,
    isLoading: isTeamLoading,
    isError: isTeamError,
    error: teamError,
    refetch: refetchTeam,
  } = useTeam(teamId);

  const { data: departments = [] } = useDepartments();

  if (isTeamLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <TeamDetailSkeleton />
      </div>
    );
  }

  if (isTeamError) {
    if (teamError instanceof ApiError && teamError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(teamError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <TeamsAccessDenied message="You do not have permission to view this team." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <TeamsError
          title="Failed to load team"
          message={getApiErrorMessage(teamError, "Could not load this team.")}
          onRetry={() => refetchTeam()}
        />
      </div>
    );
  }

  if (!team) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <TeamHeader
        team={team}
        departments={departments}
        actions={
          <TeamActions team={team} canWrite={canWrite} canDelete={canDelete} />
        }
      />

      <div className="mt-8 px-6 md:mt-10 md:px-8">
        <TeamConfigPanel team={team} canWrite={canWrite} />
      </div>
    </div>
  );
}
