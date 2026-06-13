"use client";

import { CheckCircle2, CircleOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useDeleteRole, useUpdateRole } from "@/hooks/use-roles";
import { useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getRoleDeleteBlockedMessage,
  isRoleDeactivationBlocked,
} from "@/lib/roles/guards";
import type { Role } from "@/lib/roles/types";
import { useToast } from "@/providers/toast-provider";

interface RoleActionsProps {
  role: Role;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function RoleActions({
  role,
  canWrite = true,
  canDelete = true,
}: RoleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateRole(role.id);
  const deleteMutation = useDeleteRole();
  const { data: users = [] } = useUsers();
  const [activeAction, setActiveAction] = useState<
    "activate" | "deactivate" | "delete" | null
  >(null);

  const deleteBlockedMessage = getRoleDeleteBlockedMessage(role, users);
  const deactivationBlocked = isRoleDeactivationBlocked(role);

  const handleToggleActive = async () => {
    if (deactivationBlocked && role.is_active) {
      toast.error("System roles cannot be deactivated.");
      return;
    }

    const nextActive = !role.is_active;
    setActiveAction(nextActive ? "activate" : "deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: nextActive });
      toast.success(nextActive ? "Role activated." : "Role deactivated.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          nextActive ? "Failed to activate role." : "Failed to deactivate role.",
        ),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (deleteBlockedMessage) {
      toast.error(deleteBlockedMessage);
      return;
    }

    const confirmed = window.confirm(
      `Delete "${role.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(role.id);
      toast.success(`"${role.name}" deleted.`);
      router.push("/settings/roles");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete role."));
      setActiveAction(null);
    }
  };

  const isBusy =
    activeAction !== null || updateMutation.isPending || deleteMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Actions
      </p>

      {canWrite && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy || (deactivationBlocked && role.is_active)}
            onClick={handleToggleActive}
          >
            {activeAction === "activate" || activeAction === "deactivate" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : role.is_active ? (
              <CircleOff className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {role.is_active ? "Deactivate role" : "Activate role"}
          </Button>
          {deactivationBlocked && role.is_active && (
            <p className="mt-2 text-[12px] text-muted-foreground">
              System roles cannot be deactivated.
            </p>
          )}
        </div>
      )}

      {canDelete && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy || Boolean(deleteBlockedMessage)}
            onClick={handleDelete}
          >
            {activeAction === "delete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete role
          </Button>
          {deleteBlockedMessage && (
            <p className="mt-2 text-[12px] text-muted-foreground">{deleteBlockedMessage}</p>
          )}
        </div>
      )}

      {!canWrite && !canDelete && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this role.
        </p>
      )}
    </DashboardCard>
  );
}
