"use client";

import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useActivateEmployee,
  useDeactivateEmployee,
  useDeleteEmployee,
} from "@/hooks/use-ai-employees";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AIEmployeeDetail } from "@/lib/ai-employees/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface EmployeeDetailActionsProps {
  employee: AIEmployeeDetail;
  canManage?: boolean;
  canDelete?: boolean;
}

export function EmployeeDetailActions({
  employee,
  canManage = true,
  canDelete = true,
}: EmployeeDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [activeAction, setActiveAction] = useState<"activate" | "deactivate" | "delete" | null>(
    null,
  );

  const activateMutation = useActivateEmployee(employee.id);
  const deactivateMutation = useDeactivateEmployee(employee.id);
  const deleteMutation = useDeleteEmployee();

  const isActive = employee.status === "active";
  const isBusy =
    activeAction !== null ||
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending;

  const handleActivate = async () => {
    setActiveAction("activate");
    try {
      await activateMutation.mutateAsync();
      toast.success(`"${employee.name}" activated.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to activate employee."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeactivate = async () => {
    setActiveAction("deactivate");
    try {
      await deactivateMutation.mutateAsync();
      toast.success(`"${employee.name}" deactivated.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to deactivate employee."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${employee.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(employee.id);
      toast.success(`"${employee.name}" deleted.`);
      router.push("/ai-employees");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete employee."));
      setActiveAction(null);
    }
  };

  if (!canManage && !canDelete) return null;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Status & actions
      </p>

      {canManage && (
        <div className="mt-4 flex flex-col gap-2">
          {isActive ? (
            <Button
              variant="secondary"
              size="sm"
              className="justify-start"
              disabled={isBusy}
              onClick={handleDeactivate}
            >
              {activeAction === "deactivate" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PowerOff className="size-3.5" />
              )}
              Deactivate employee
            </Button>
          ) : (
            <Button
              variant="brand"
              size="sm"
              className="justify-start"
              disabled={isBusy}
              onClick={handleActivate}
            >
              {activeAction === "activate" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Power className="size-3.5" />
              )}
              Activate employee
            </Button>
          )}
          <p className="text-[12px] text-muted-foreground">
            {isActive
              ? "Active employees can receive chat requests."
              : "Inactive employees cannot be chatted with."}
          </p>
        </div>
      )}

      {canDelete && (
        <div className={cn("border-t border-white/[0.06] pt-4", canManage && "mt-4")}>
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
            Delete employee
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
