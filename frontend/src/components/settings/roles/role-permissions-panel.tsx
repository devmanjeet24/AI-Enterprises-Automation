"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { RoleDetail } from "@/lib/roles/types";

import { RolePermissionsMatrix } from "./role-permissions-matrix";

interface RolePermissionsPanelProps {
  role: RoleDetail;
  canAssign?: boolean;
}

export function RolePermissionsPanel({ role, canAssign = false }: RolePermissionsPanelProps) {
  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          Permission grants
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Toggle permissions to grant or revoke access for the &ldquo;{role.name}&rdquo; role.
        </p>
      </div>

      <div className="mt-6">
        <RolePermissionsMatrix
          roleId={role.id}
          grantedPermissions={role.permissions}
          canAssign={canAssign}
        />
      </div>
    </DashboardCard>
  );
}
