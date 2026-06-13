"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  filterMatrixRowsBySearch,
  groupPermissionsByResource,
  PERMISSION_MATRIX_COLUMNS,
} from "@/config/permissions";
import type { Permission } from "@/lib/permissions/types";
import type { PermissionSummary } from "@/lib/roles/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import {
  useAssignPermissionToRole,
  usePermissions,
  useRemovePermissionFromRole,
} from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

import { RolePermissionRow } from "./role-permission-row";
import { RolesError } from "./roles-error";

interface RolePermissionsMatrixProps {
  roleId: string;
  grantedPermissions: PermissionSummary[];
  canAssign?: boolean;
}

export function RolePermissionsMatrix({
  roleId,
  grantedPermissions,
  canAssign = false,
}: RolePermissionsMatrixProps) {
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(null);

  const {
    data: catalog = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePermissions();

  const assignMutation = useAssignPermissionToRole(roleId);
  const removeMutation = useRemovePermissionFromRole(roleId);

  const grantedIds = useMemo(
    () => new Set(grantedPermissions.map((permission) => permission.id)),
    [grantedPermissions],
  );

  const activeCatalog = useMemo(
    () => catalog.filter((permission) => permission.is_active),
    [catalog],
  );

  const matrixRows = useMemo(() => {
    const rows = groupPermissionsByResource(activeCatalog);
    return filterMatrixRowsBySearch(rows, search);
  }, [activeCatalog, search]);

  const grantedCount = grantedPermissions.length;
  const totalCount = activeCatalog.length;

  const handleToggle = async (permission: Permission, isGranted: boolean) => {
    if (!canAssign) return;

    setPendingPermissionId(permission.id);
    try {
      if (isGranted) {
        await removeMutation.mutateAsync(permission.id);
        toast.success(`Revoked ${permission.slug}.`);
      } else {
        await assignMutation.mutateAsync({ permission_id: permission.id });
        toast.success(`Granted ${permission.slug}.`);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isGranted ? "Failed to revoke permission." : "Failed to grant permission.",
        ),
      );
    } finally {
      setPendingPermissionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <RolesError
        title="Failed to load permissions catalog"
        message={getApiErrorMessage(error, "Could not load permissions.")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">
            {grantedCount} / {totalCount} permissions granted
          </p>
          {!canAssign && (
            <p className="mt-1 text-[12px] text-tertiary">
              Read-only view. Contact an admin to modify permission grants.
            </p>
          )}
        </div>
        <Input
          placeholder="Filter by resource or permission…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className={cn("border-b border-white/[0.06]", accent.bgSubtle)}>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Resource
              </th>
              {PERMISSION_MATRIX_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.length === 0 ? (
              <tr>
                <td
                  colSpan={PERMISSION_MATRIX_COLUMNS.length + 1}
                  className="px-4 py-8 text-center text-[13px] text-muted-foreground"
                >
                  No permissions match your search.
                </td>
              </tr>
            ) : (
              matrixRows.map((row) => (
                <RolePermissionRow
                  key={row.resource}
                  row={row}
                  grantedIds={grantedIds}
                  canAssign={canAssign}
                  pendingPermissionId={pendingPermissionId}
                  onToggle={handleToggle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
