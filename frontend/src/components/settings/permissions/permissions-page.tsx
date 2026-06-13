"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { Input } from "@/components/ui/input";
import {
  filterPermissionsByResource,
  filterPermissionsBySearch,
  filterPermissionsByStatus,
  getResourceFilterOptions,
} from "@/config/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/permissions/access";
import type {
  PermissionResourceFilter,
  PermissionStatusFilter,
} from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreatePermissionModal } from "./create-permission-modal";
import { PermissionCardGrid } from "./permission-card-grid";
import { PermissionsAccessDenied } from "./permissions-access-denied";
import { PermissionsEmptyState } from "./permissions-empty-state";
import { PermissionsError } from "./permissions-error";
import { PermissionsHero } from "./permissions-hero";
import { PermissionsSkeleton } from "./permissions-skeleton";
import { PermissionsStats } from "./permissions-stats";

const statusFilters: { value: PermissionStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function PermissionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PermissionStatusFilter>("all");
  const [resourceFilter, setResourceFilter] = useState<PermissionResourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const accent = dashboardAccents.purple;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.PERMISSIONS_WRITE);

  const {
    data: catalog = [],
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
    error: permissionsError,
    refetch: refetchPermissions,
  } = usePermissions();

  const resourceOptions = useMemo(
    () => getResourceFilterOptions(catalog),
    [catalog],
  );

  const filteredPermissions = useMemo(() => {
    let result = catalog;
    result = filterPermissionsByStatus(result, statusFilter);
    result = filterPermissionsByResource(result, resourceFilter);
    result = filterPermissionsBySearch(result, searchQuery);
    return result;
  }, [catalog, statusFilter, resourceFilter, searchQuery]);

  const accessDenied = isPermissionsError && isAccessDeniedError(permissionsError);
  const errorMessage = isPermissionsError
    ? getApiErrorMessage(permissionsError, "Failed to load permissions.")
    : null;

  if (isPermissionsLoading) {
    return <PermissionsSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <PermissionsAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <PermissionsHero
        permissions={catalog}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Access control"
            title="Catalog overview"
            description="Monitor default and custom permissions across resource groups."
          />
          <PermissionsStats permissions={catalog} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Directory"
            title="Permission catalog"
            description="Open a permission to edit its definition or review linked roles."
          />

          {isPermissionsError ? (
            <PermissionsError
              title="Failed to load permissions"
              message={errorMessage!}
              onRetry={() => refetchPermissions()}
            />
          ) : catalog.length === 0 ? (
            <PermissionsEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Input
                  placeholder="Search permissions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
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
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setResourceFilter("all")}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                    resourceFilter === "all"
                      ? cn(accent.bgSubtle, accent.border, accent.text)
                      : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                  )}
                >
                  All resources
                </button>
                {resourceOptions.map(({ resource, label }) => (
                  <button
                    key={resource}
                    type="button"
                    onClick={() => setResourceFilter(resource)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                      resourceFilter === resource
                        ? cn(accent.bgSubtle, accent.border, accent.text)
                        : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredPermissions.length === 0 ? (
                <PermissionsEmptyState
                  title="No permissions match your filters"
                  description="Try adjusting search, status, or resource filters."
                />
              ) : (
                <PermissionCardGrid permissions={filteredPermissions} />
              )}
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreatePermissionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
