"use client";

import { useMemo, useState } from "react";

import { notFound } from "next/navigation";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { useDepartment } from "@/hooks/use-departments";
import { useTeams } from "@/hooks/use-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/departments/access";

import { DepartmentActions } from "./department-actions";
import { DepartmentConfigPanel } from "./department-config-panel";
import { DepartmentHeader } from "./department-header";
import { DepartmentLinkedTeams } from "./department-linked-teams";
import { DepartmentsAccessDenied } from "./departments-access-denied";
import { DepartmentsError } from "./departments-error";
import { DepartmentDetailSkeleton } from "./departments-skeleton";

interface DepartmentDetailPageProps {
  departmentId: string;
}

export function DepartmentDetailPage({ departmentId }: DepartmentDetailPageProps) {
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.DEPARTMENTS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.DEPARTMENTS_DELETE);
  const canCreateTeam = hasPermission(permissions, PERMISSIONS.TEAMS_WRITE);

  const {
    data: department,
    isLoading: isDepartmentLoading,
    isError: isDepartmentError,
    error: departmentError,
    refetch: refetchDepartment,
  } = useDepartment(departmentId);

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    isError: isTeamsError,
    error: teamsError,
    refetch: refetchTeams,
  } = useTeams();

  const linkedTeams = useMemo(
    () => teams.filter((team) => team.department_id === departmentId),
    [teams, departmentId],
  );

  if (isDepartmentLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <DepartmentDetailSkeleton />
      </div>
    );
  }

  if (isDepartmentError) {
    if (departmentError instanceof ApiError && departmentError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(departmentError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <DepartmentsAccessDenied message="You do not have permission to view this department." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <DepartmentsError
          title="Failed to load department"
          message={getApiErrorMessage(departmentError, "Could not load this department.")}
          onRetry={() => refetchDepartment()}
        />
      </div>
    );
  }

  if (!department) notFound();

  const teamsErrorMessage = isTeamsError
    ? getApiErrorMessage(teamsError, "Could not load linked teams.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <DepartmentHeader
        department={department}
        teamCount={linkedTeams.length}
        actions={
          <DepartmentActions
            department={department}
            linkedTeams={linkedTeams}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        }
      />

      <div className="mt-8 space-y-10 px-6 md:mt-10 md:px-8">
        <DepartmentConfigPanel department={department} canWrite={canWrite} />

        <section>
          <DashboardSectionHeader
            eyebrow="Structure"
            title="Linked org teams"
            description="Teams nested under this department. These are organizational teams, not Agent Teams."
          />
          <div className="mt-5">
            <DepartmentLinkedTeams
              teams={linkedTeams}
              isLoading={isTeamsLoading}
              isError={isTeamsError}
              errorMessage={teamsErrorMessage}
              onRetry={() => refetchTeams()}
              canCreate={canCreateTeam}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
