"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { filterDepartmentsByStatus } from "@/config/departments";
import { useDepartments } from "@/hooks/use-departments";
import { useTeams } from "@/hooks/use-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/departments/access";
import type { DepartmentStatusFilter } from "@/lib/departments/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateDepartmentModal } from "./create-department-modal";
import { DepartmentCardGrid } from "./department-card-grid";
import { DepartmentsAccessDenied } from "./departments-access-denied";
import { DepartmentsEmptyState } from "./departments-empty-state";
import { DepartmentsError } from "./departments-error";
import { DepartmentsHero } from "./departments-hero";
import { DepartmentsSkeleton } from "./departments-skeleton";
import { DepartmentsStats } from "./departments-stats";

const statusFilters: { value: DepartmentStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DepartmentStatusFilter>("all");
  const accent = dashboardAccents.blue;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.DEPARTMENTS_WRITE);

  const {
    data: departments = [],
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useDepartments();

  const { data: teams = [] } = useTeams();

  const filteredDepartments = useMemo(
    () => filterDepartmentsByStatus(departments, statusFilter),
    [departments, statusFilter],
  );

  const accessDenied = isDepartmentsError && isAccessDeniedError(departmentsError);
  const errorMessage = isDepartmentsError
    ? getApiErrorMessage(departmentsError, "Failed to load departments.")
    : null;

  if (isDepartmentsLoading) {
    return <DepartmentsSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <DepartmentsAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <DepartmentsHero
        departments={departments}
        teamCount={teams.length}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Structure"
            title="Department overview"
            description="Monitor active organizational units and linked team counts."
          />
          <DepartmentsStats departments={departments} teamCount={teams.length} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Directory"
            title="Organization departments"
            description="Open a department to edit its profile, manage status, or review linked teams."
          />

          {isDepartmentsError ? (
            <DepartmentsError
              title="Failed to load departments"
              message={errorMessage!}
              onRetry={() => refetchDepartments()}
            />
          ) : departments.length === 0 ? (
            <DepartmentsEmptyState
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
              <DepartmentCardGrid departments={filteredDepartments} teams={teams} />
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateDepartmentModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
