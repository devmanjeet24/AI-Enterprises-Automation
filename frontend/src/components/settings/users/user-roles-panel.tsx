"use client";

import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useAssignUserRole,
  useRemoveUserRole,
  useRoles,
  useUsers,
} from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRemoveRoleBlockedMessage } from "@/lib/users/guards";
import type { User } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface UserRolesPanelProps {
  user: User;
  canAssignRole?: boolean;
}

export function UserRolesPanel({ user, canAssignRole = true }: UserRolesPanelProps) {
  const accent = dashboardAccents.emerald;
  const toast = useToast();
  const assignMutation = useAssignUserRole(user.id);
  const removeMutation = useRemoveUserRole(user.id);
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: allUsers = [] } = useUsers();

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

  const availableRoles = useMemo(() => {
    const assignedIds = new Set(user.roles.map((role) => role.id));
    return roles.filter((role) => role.is_active && !assignedIds.has(role.id));
  }, [roles, user.roles]);

  const handleAssign = async () => {
    if (!selectedRoleId) return;

    try {
      await assignMutation.mutateAsync({ role_id: selectedRoleId });
      toast.success("Role assigned.");
      setSelectedRoleId("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to assign role."));
    }
  };

  const handleRemove = async (roleId: string) => {
    const blockedMessage = getRemoveRoleBlockedMessage(user, roleId, allUsers);
    if (blockedMessage) {
      toast.error(blockedMessage);
      return;
    }

    const role = user.roles.find((item) => item.id === roleId);
    const confirmed = window.confirm(
      `Remove "${role?.name ?? "this role"}" from this user?`,
    );
    if (!confirmed) return;

    setRemovingRoleId(roleId);
    try {
      await removeMutation.mutateAsync(roleId);
      toast.success("Role removed.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove role."));
    } finally {
      setRemovingRoleId(null);
    }
  };

  const isAssigning = assignMutation.isPending;
  const isBusy = isAssigning || removeMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
      <div className="flex items-center gap-2">
        <Shield className={cn("size-4", accent.text)} />
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Role assignments
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage which roles this user holds in your organization.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {user.roles.length > 0 ? (
          user.roles.map((role) => {
            const blockedMessage = getRemoveRoleBlockedMessage(user, role.id, allUsers);
            const isRemoving = removingRoleId === role.id;

            return (
              <div
                key={role.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{role.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-tertiary">{role.slug}</p>
                </div>
                {canAssignRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isBusy || Boolean(blockedMessage)}
                    title={blockedMessage ?? undefined}
                    onClick={() => handleRemove(role.id)}
                  >
                    {isRemoving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-[13px] text-muted-foreground">
            No roles assigned to this user.
          </p>
        )}
      </div>

      {canAssignRole && (
        <div className="mt-6 border-t border-white/[0.06] pt-6">
          <Label htmlFor="assign-role">Assign role</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              id="assign-role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={isBusy || isLoadingRoles || availableRoles.length === 0}
              className={cn(
                "flex h-10 w-full rounded-xl border border-border bg-white/[0.04] px-3 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">
                {availableRoles.length === 0 ? "No roles available" : "Select a role…"}
              </option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <Button
              variant="brand"
              size="sm"
              className="shrink-0"
              disabled={!selectedRoleId || isBusy}
              onClick={handleAssign}
            >
              {isAssigning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Assign
            </Button>
          </div>
        </div>
      )}

      {!canAssignRole && user.roles.length > 0 && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to role assignments.
        </p>
      )}
    </DashboardCard>
  );
}
