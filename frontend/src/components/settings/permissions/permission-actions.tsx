"use client";

import { CheckCircle2, CircleOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useDeletePermission,
  useUpdatePermission,
} from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getPermissionDeleteWarning } from "@/lib/permissions/guards";
import type { Permission } from "@/lib/permissions/types";
import { useToast } from "@/providers/toast-provider";

interface PermissionActionsProps {
  permission: Permission;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function PermissionActions({
  permission,
  canWrite = true,
  canDelete = true,
}: PermissionActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdatePermission(permission.id);
  const deleteMutation = useDeletePermission();
  const [activeAction, setActiveAction] = useState<
    "activate" | "deactivate" | "delete" | null
  >(null);

  const deleteWarning = getPermissionDeleteWarning(permission.slug);

  const handleToggleActive = async () => {
    const nextActive = !permission.is_active;
    setActiveAction(nextActive ? "activate" : "deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: nextActive });
      toast.success(
        nextActive ? "Permission activated." : "Permission deactivated.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          nextActive ? "Failed to activate permission." : "Failed to deactivate permission.",
        ),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const warning = deleteWarning
      ? `${deleteWarning}\n\n`
      : "";
    const confirmed = window.confirm(
      `${warning}Delete "${permission.name}"? This action cannot be undone and will revoke grants from all roles.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(permission.id);
      toast.success(`"${permission.name}" deleted.`);
      router.push("/settings/permissions");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete permission."));
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
            disabled={isBusy}
            onClick={handleToggleActive}
          >
            {activeAction === "activate" || activeAction === "deactivate" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : permission.is_active ? (
              <CircleOff className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {permission.is_active ? "Deactivate permission" : "Activate permission"}
          </Button>
        </div>
      )}

      {canDelete && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={handleDelete}
          >
            {activeAction === "delete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete permission
          </Button>
          {deleteWarning && (
            <p className="mt-2 text-[12px] text-muted-foreground">{deleteWarning}</p>
          )}
        </div>
      )}

      {!canWrite && !canDelete && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this permission.
        </p>
      )}
    </DashboardCard>
  );
}
