"use client";

import { CheckCircle2, CircleOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useDeleteDepartment,
  useUpdateDepartment,
} from "@/hooks/use-departments";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getDepartmentDeleteBlockedMessage } from "@/lib/departments/guards";
import type { Department } from "@/lib/departments/types";
import type { Team } from "@/lib/teams/types";
import { useToast } from "@/providers/toast-provider";

interface DepartmentActionsProps {
  department: Department;
  linkedTeams?: Team[];
  canWrite?: boolean;
  canDelete?: boolean;
}

export function DepartmentActions({
  department,
  linkedTeams = [],
  canWrite = true,
  canDelete = true,
}: DepartmentActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateDepartment(department.id);
  const deleteMutation = useDeleteDepartment();
  const [activeAction, setActiveAction] = useState<
    "activate" | "deactivate" | "delete" | null
  >(null);

  const deleteBlockedMessage = getDepartmentDeleteBlockedMessage(linkedTeams);

  const handleToggleActive = async () => {
    const nextActive = !department.is_active;
    setActiveAction(nextActive ? "activate" : "deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: nextActive });
      toast.success(
        nextActive ? "Department activated." : "Department deactivated.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          nextActive ? "Failed to activate department." : "Failed to deactivate department.",
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
      `Delete "${department.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(department.id);
      toast.success(`"${department.name}" deleted.`);
      router.push("/settings/departments");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete department."));
      setActiveAction(null);
    }
  };

  const isBusy =
    activeAction !== null || updateMutation.isPending || deleteMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
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
            ) : department.is_active ? (
              <CircleOff className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {department.is_active ? "Deactivate department" : "Activate department"}
          </Button>
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
            Delete department
          </Button>
          {deleteBlockedMessage && (
            <p className="mt-2 text-[12px] text-muted-foreground">{deleteBlockedMessage}</p>
          )}
        </div>
      )}

      {!canWrite && !canDelete && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this department.
        </p>
      )}
    </DashboardCard>
  );
}
