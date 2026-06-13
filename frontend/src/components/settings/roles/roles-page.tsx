"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { filterRolesByStatus } from "@/config/roles";
import { useRoles } from "@/hooks/use-roles";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/roles/access";
import type { RoleStatusFilter } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateRoleModal } from "./create-role-modal";
import { RoleCardGrid } from "./role-card-grid";
import { RolesAccessDenied } from "./roles-access-denied";
import { RolesEmptyState } from "./roles-empty-state";
import { RolesError } from "./roles-error";
import { RolesHero } from "./roles-hero";
import { RolesSkeleton } from "./roles-skeleton";
import { RolesStats } from "./roles-stats";

const statusFilters: { value: RoleStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "system", label: "System" },
  { value: "custom", label: "Custom" },
];

export function RolesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RoleStatusFilter>("all");
  const accent = dashboardAccents.purple;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.ROLES_WRITE);

  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  const filteredRoles = useMemo(
    () => filterRolesByStatus(roles, statusFilter),
    [roles, statusFilter],
  );

  const accessDenied = isRolesError && isAccessDeniedError(rolesError);
  const errorMessage = isRolesError
    ? getApiErrorMessage(rolesError, "Failed to load roles.")
    : null;

  if (isRolesLoading) {
    return <RolesSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <RolesAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <RolesHero
        roles={roles}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Access control"
            title="Role overview"
            description="Monitor system and custom roles across your organization."
          />
          <RolesStats roles={roles} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Directory"
            title="Organization roles"
            description="Open a role to edit its profile, manage status, or configure permission grants."
          />

          {isRolesError ? (
            <RolesError
              title="Failed to load roles"
              message={errorMessage!}
              onRetry={() => refetchRoles()}
            />
          ) : roles.length === 0 ? (
            <RolesEmptyState
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
              {filteredRoles.length === 0 ? (
                <RolesEmptyState
                  title="No roles match this filter"
                  description="Try a different filter to see more roles."
                />
              ) : (
                <RoleCardGrid roles={filteredRoles} />
              )}
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
