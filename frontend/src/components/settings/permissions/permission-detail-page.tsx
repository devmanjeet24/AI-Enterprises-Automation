"use client";

import { useMemo } from "react";

import { notFound } from "next/navigation";
import { useQueries } from "@tanstack/react-query";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { usePermission } from "@/hooks/use-permissions";
import { useRoles } from "@/hooks/use-roles";
import { useAuthToken, useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRole } from "@/lib/api/roles";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { getLinkedRolesForPermission } from "@/lib/permissions/guards";
import { isAccessDeniedError } from "@/lib/permissions/access";
import { roleKeys } from "@/lib/roles/query-keys";

import { PermissionActions } from "./permission-actions";
import { PermissionConfigPanel } from "./permission-config-panel";
import { PermissionHeader } from "./permission-header";
import { PermissionRolesPanel } from "./permission-roles-panel";
import { PermissionsAccessDenied } from "./permissions-access-denied";
import { PermissionsError } from "./permissions-error";
import { PermissionDetailSkeleton } from "./permissions-skeleton";

interface PermissionDetailPageProps {
  permissionId: string;
}

export function PermissionDetailPage({ permissionId }: PermissionDetailPageProps) {
  const token = useAuthToken();
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.PERMISSIONS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.PERMISSIONS_DELETE);
  const canReadRoles = hasPermission(permissions, PERMISSIONS.ROLES_READ);

  const {
    data: permission,
    isLoading: isPermissionLoading,
    isError: isPermissionError,
    error: permissionError,
    refetch: refetchPermission,
  } = usePermission(permissionId);

  const { data: roles = [] } = useRoles();

  const roleDetailQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: roleKeys.detail(role.id),
      queryFn: () => getRole(token!, role.id),
      enabled: Boolean(token) && canReadRoles && Boolean(permission),
    })),
  });

  const linkedRoleCount = useMemo(() => {
    if (!permission || !canReadRoles) return 0;
    return getLinkedRolesForPermission(
      permission.id,
      roleDetailQueries
        .map((query) => query.data)
        .filter((role): role is NonNullable<typeof role> => Boolean(role)),
    ).length;
  }, [permission, canReadRoles, roleDetailQueries]);

  if (isPermissionLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <PermissionDetailSkeleton />
      </div>
    );
  }

  if (isPermissionError) {
    if (permissionError instanceof ApiError && permissionError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(permissionError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <PermissionsAccessDenied message="You do not have permission to view this permission." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <PermissionsError
          title="Failed to load permission"
          message={getApiErrorMessage(permissionError, "Could not load this permission.")}
          onRetry={() => refetchPermission()}
        />
      </div>
    );
  }

  if (!permission) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <PermissionHeader
        permission={permission}
        linkedRoleCount={linkedRoleCount}
        actions={
          <PermissionActions
            permission={permission}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        }
      />

      <div className="mt-8 space-y-10 px-6 md:mt-10 md:px-8">
        <PermissionConfigPanel permission={permission} canWrite={canWrite} />

        <section>
          <DashboardSectionHeader
            eyebrow="Role grants"
            title="Linked roles"
            description="Roles that currently include this permission. Grant or revoke access from role settings."
          />
          <div className="mt-5">
            <PermissionRolesPanel permission={permission} />
          </div>
        </section>
      </div>
    </div>
  );
}
