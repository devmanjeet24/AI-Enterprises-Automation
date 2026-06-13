"use client";

import { Check, Loader2, Minus } from "lucide-react";

import {
  formatPermissionAction,
  getMatrixCellPermissions,
  type PermissionActionColumn,
  type PermissionMatrixRow,
} from "@/config/permissions";
import type { Permission } from "@/lib/permissions/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface RolePermissionRowProps {
  row: PermissionMatrixRow;
  grantedIds: Set<string>;
  canAssign?: boolean;
  pendingPermissionId?: string | null;
  onToggle?: (permission: Permission, isGranted: boolean) => void;
}

function MatrixCell({
  column,
  permissions,
  grantedIds,
  canAssign,
  pendingPermissionId,
  onToggle,
}: {
  column: PermissionActionColumn;
  permissions: Permission[];
  grantedIds: Set<string>;
  canAssign?: boolean;
  pendingPermissionId?: string | null;
  onToggle?: (permission: Permission, isGranted: boolean) => void;
}) {
  const accent = dashboardAccents.purple;

  if (permissions.length === 0) {
    return (
      <td className="px-3 py-3 text-center">
        <Minus className="mx-auto size-3.5 text-tertiary/50" />
      </td>
    );
  }

  if (column === "other" && permissions.length > 1) {
    return (
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1.5">
          {permissions.map((permission) => {
            const isGranted = grantedIds.has(permission.id);
            const isPending = pendingPermissionId === permission.id;
            const action = permission.slug.split(":")[1] ?? permission.slug;

            return (
              <MatrixToggle
                key={permission.id}
                label={formatPermissionAction(action)}
                permission={permission}
                isGranted={isGranted}
                isPending={isPending}
                canAssign={canAssign}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      </td>
    );
  }

  const permission = permissions[0];
  const isGranted = grantedIds.has(permission.id);
  const isPending = pendingPermissionId === permission.id;
  const action = permission.slug.split(":")[1] ?? permission.slug;
  const label = column === "other" ? formatPermissionAction(action) : undefined;

  return (
    <td className="px-3 py-3 text-center">
      <MatrixToggle
        label={label}
        permission={permission}
        isGranted={isGranted}
        isPending={isPending}
        canAssign={canAssign}
        onToggle={onToggle}
        compact
      />
    </td>
  );
}

function MatrixToggle({
  permission,
  isGranted,
  isPending,
  canAssign,
  onToggle,
  label,
  compact = false,
}: {
  permission: Permission;
  isGranted: boolean;
  isPending: boolean;
  canAssign?: boolean;
  onToggle?: (permission: Permission, isGranted: boolean) => void;
  label?: string;
  compact?: boolean;
}) {
  const accent = dashboardAccents.purple;

  if (!canAssign) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px]",
          isGranted
            ? cn(accent.bgSubtle, accent.border, accent.text)
            : "border-white/[0.06] text-tertiary",
          compact && "mx-auto",
        )}
        title={permission.slug}
      >
        {isGranted ? <Check className="size-3" /> : <Minus className="size-3" />}
        {label && <span>{label}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => onToggle?.(permission, isGranted)}
      title={`${isGranted ? "Revoke" : "Grant"} ${permission.slug}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors",
        isGranted
          ? cn(accent.bgSubtle, accent.border, accent.text, "hover:bg-purple-400/20")
          : "border-white/[0.08] text-muted-foreground hover:border-white/[0.14] hover:text-foreground",
        compact && "mx-auto",
        isPending && "opacity-60",
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : isGranted ? (
        <Check className="size-3" />
      ) : (
        <Minus className="size-3" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}

export function RolePermissionRow({
  row,
  grantedIds,
  canAssign,
  pendingPermissionId,
  onToggle,
}: RolePermissionRowProps) {
  const columns: PermissionActionColumn[] = [
    "read",
    "write",
    "delete",
    "execute",
    "other",
  ];

  return (
    <tr className="border-b border-white/[0.04] last:border-b-0">
      <td className="px-4 py-3 text-[13px] font-medium text-foreground">{row.label}</td>
      {columns.map((column) => (
        <MatrixCell
          key={column}
          column={column}
          permissions={getMatrixCellPermissions(row.cells[column])}
          grantedIds={grantedIds}
          canAssign={canAssign}
          pendingPermissionId={pendingPermissionId}
          onToggle={onToggle}
        />
      ))}
    </tr>
  );
}
