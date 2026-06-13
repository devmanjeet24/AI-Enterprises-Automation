"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { getRole } from "@/lib/api/roles";
import { getLinkedRolesForPermission } from "@/lib/permissions/guards";
import type { Permission } from "@/lib/permissions/types";
import { roleKeys } from "@/lib/roles/query-keys";
import { useRoles } from "@/hooks/use-roles";
import { useAuthToken, useUserPermissions } from "@/hooks/use-auth-token";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { PermissionsError } from "./permissions-error";

interface PermissionRolesPanelProps {
  permission: Permission;
}

export function PermissionRolesPanel({ permission }: PermissionRolesPanelProps) {
  const accent = dashboardAccents.purple;
  const token = useAuthToken();
  const userPermissions = useUserPermissions();
  const canReadRoles = hasPermission(userPermissions, PERMISSIONS.ROLES_READ);

  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
    refetch: refetchRoles,
  } = useRoles();

  const roleDetailQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: roleKeys.detail(role.id),
      queryFn: () => getRole(token!, role.id),
      enabled: Boolean(token) && canReadRoles && roles.length > 0,
    })),
  });

  const isLoadingDetails =
    canReadRoles &&
    (isRolesLoading || roleDetailQueries.some((query) => query.isLoading));

  const linkedRoles = getLinkedRolesForPermission(
    permission.id,
    roleDetailQueries
      .map((query) => query.data)
      .filter((role): role is NonNullable<typeof role> => Boolean(role)),
  );

  if (!canReadRoles) {
    return (
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          Linked roles
        </p>
        <p className="mt-3 text-[13px] text-muted-foreground">
          You need roles:read permission to view which roles grant this permission.
        </p>
      </DashboardCard>
    );
  }

  if (isRolesError) {
    return (
      <PermissionsError
        title="Failed to load roles"
        message="Could not load roles for linked grant lookup."
        onRetry={() => refetchRoles()}
      />
    );
  }

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          Linked roles
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Read-only list of roles that currently grant &ldquo;{permission.slug}&rdquo;.
          Manage grants from the role detail page.
        </p>
      </div>

      <div className="mt-5">
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : linkedRoles.length === 0 ? (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center text-[13px] text-muted-foreground">
            No roles currently grant this permission.
          </p>
        ) : (
          <ul className="space-y-2">
            {linkedRoles.map((role) => (
              <li key={role.id}>
                <Link
                  href={`/settings/roles/${role.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                        accent.bgSubtle,
                        accent.border,
                      )}
                    >
                      <Shield className={cn("size-4", accent.text)} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-foreground">
                        {role.name}
                      </p>
                      <p className="truncate font-mono text-[12px] text-tertiary">
                        {role.slug}
                      </p>
                    </div>
                  </div>
                  <span className={cn("flex shrink-0 items-center gap-1 text-[12px]", accent.text)}>
                    View role
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardCard>
  );
}
