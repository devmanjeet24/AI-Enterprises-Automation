"use client";

import type { Permission } from "@/lib/permissions/types";

import { PermissionCard } from "./permission-card";

interface PermissionCardGridProps {
  permissions: Permission[];
}

export function PermissionCardGrid({ permissions }: PermissionCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {permissions.map((permission) => (
        <PermissionCard key={permission.id} permission={permission} />
      ))}
    </div>
  );
}
