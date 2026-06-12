"use client";

import { Archive, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useDeleteWorkflow, useUpdateWorkflow } from "@/hooks/use-workflows";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { WorkflowDetail } from "@/lib/workflows/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface WorkflowDetailActionsProps {
  workflow: WorkflowDetail;
  canWrite?: boolean;
  canDelete?: boolean;
  onRunClick?: () => void;
}

export function WorkflowDetailActions({
  workflow,
  canWrite = true,
  canDelete = true,
  onRunClick,
}: WorkflowDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateWorkflow(workflow.id);
  const deleteMutation = useDeleteWorkflow();
  const [activeAction, setActiveAction] = useState<"archive" | "delete" | null>(
    null,
  );

  const canRun =
    workflow.is_active &&
    workflow.status === "active" &&
    workflow.steps.length > 0;

  const handleArchive = async () => {
    setActiveAction("archive");
    try {
      await updateMutation.mutateAsync({ status: "archived", is_active: false });
      toast.success("Workflow archived.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to archive workflow."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${workflow.name}"? This will remove all steps and run history.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(workflow.id);
      toast.success(`"${workflow.name}" deleted.`);
      router.push("/workflows");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete workflow."));
      setActiveAction(null);
    }
  };

  const isBusy =
    activeAction !== null ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Actions
      </p>

      {canWrite && (
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="brand"
            size="sm"
            className="justify-start"
            disabled={!canRun || isBusy}
            onClick={onRunClick}
          >
            <Play className="size-3.5" />
            Run workflow
          </Button>
          <p className="text-[12px] text-muted-foreground">
            {canRun
              ? "Execute all steps through the linked agent team."
              : "Activate workflow and add steps to run."}
          </p>
        </div>
      )}

      {canWrite && workflow.status !== "archived" && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={handleArchive}
          >
            {activeAction === "archive" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Archive className="size-3.5" />
            )}
            Archive workflow
          </Button>
        </div>
      )}

      {canDelete && (
        <div
          className={cn(
            "mt-4 border-t border-white/[0.06] pt-4",
            !canWrite && "mt-0 border-t-0 pt-0",
          )}
        >
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
            Delete workflow
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
