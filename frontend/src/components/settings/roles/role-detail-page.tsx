"use client";

import { useState } from "react";

import { notFound } from "next/navigation";

import { useRole } from "@/hooks/use-roles";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/roles/access";

import { RoleActions } from "./role-actions";
import { RoleConfigPanel } from "./role-config-panel";
import { RoleDetailTabs, type RoleDetailTab } from "./role-detail-tabs";
import { RoleHeader } from "./role-header";
import { RolePermissionsPanel } from "./role-permissions-panel";
import { RolesAccessDenied } from "./roles-access-denied";
import { RolesError } from "./roles-error";
import { RoleDetailSkeleton } from "./roles-skeleton";

interface RoleDetailPageProps {
  roleId: string;
}

export function RoleDetailPage({ roleId }: RoleDetailPageProps) {
  const [activeTab, setActiveTab] = useState<RoleDetailTab>("configure");
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.ROLES_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.ROLES_DELETE);
  const canAssign = hasPermission(permissions, PERMISSIONS.PERMISSIONS_ASSIGN);

  const {
    data: role,
    isLoading: isRoleLoading,
    isError: isRoleError,
    error: roleError,
    refetch: refetchRole,
  } = useRole(roleId);

  if (isRoleLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <RoleDetailSkeleton />
      </div>
    );
  }

  if (isRoleError) {
    if (roleError instanceof ApiError && roleError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(roleError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <RolesAccessDenied message="You do not have permission to view this role." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <RolesError
          title="Failed to load role"
          message={getApiErrorMessage(roleError, "Could not load this role.")}
          onRetry={() => refetchRole()}
        />
      </div>
    );
  }

  if (!role) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <RoleHeader
        role={role}
        actions={
          <RoleActions
            role={role}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        }
      />

      <div className="mt-8 space-y-8 px-6 md:mt-10 md:px-8">
        <RoleDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          permissionCount={role.permissions.length}
        />

        {activeTab === "configure" ? (
          <RoleConfigPanel role={role} canWrite={canWrite} />
        ) : (
          <RolePermissionsPanel role={role} canAssign={canAssign} />
        )}
      </div>
    </div>
  );
}
