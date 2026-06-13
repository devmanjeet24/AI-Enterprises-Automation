"use client";

import { Archive, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useDeleteResearchProject,
  useUpdateResearchProject,
} from "@/hooks/use-research-projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  canRunResearchProject,
  getResearchRunBlockedMessage,
} from "@/lib/research-hub/run-messages";
import type { ResearchProjectDetail } from "@/lib/research-hub/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface ResearchProjectActionsProps {
  project: ResearchProjectDetail;
  canWrite?: boolean;
  canDelete?: boolean;
  canExecute?: boolean;
  onRunClick?: () => void;
}

export function ResearchProjectActions({
  project,
  canWrite = true,
  canDelete = true,
  canExecute = true,
  onRunClick,
}: ResearchProjectActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateResearchProject(project.id);
  const deleteMutation = useDeleteResearchProject();
  const [activeAction, setActiveAction] = useState<"activate" | "archive" | "delete" | null>(
    null,
  );

  const canRun = canRunResearchProject(project, canExecute);
  const runBlockedMessage = getResearchRunBlockedMessage(project, {
    canExecute,
    canWrite,
  });

  const handleActivate = async () => {
    setActiveAction("activate");
    try {
      await updateMutation.mutateAsync({ status: "active", is_active: true });
      toast.success("Research project activated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to activate project."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleArchive = async () => {
    setActiveAction("archive");
    try {
      await updateMutation.mutateAsync({ status: "archived", is_active: false });
      toast.success("Research project archived.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to archive project."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This will remove all reports and execution history.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(project.id);
      toast.success(`"${project.name}" deleted.`);
      router.push("/research-hub");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete project."));
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

      {canExecute && (
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="brand"
            size="sm"
            className="justify-start"
            disabled={!canRun || isBusy}
            onClick={onRunClick}
          >
            <Play className="size-3.5" />
            Run research
          </Button>
          <p className="text-[12px] text-muted-foreground">
            {canRun
              ? "Execute the methodology template through the assigned agent team."
              : runBlockedMessage}
          </p>
        </div>
      )}

      {canWrite && project.status === "draft" && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={handleActivate}
          >
            {activeAction === "activate" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Activate project
          </Button>
        </div>
      )}

      {!canWrite && project.status === "draft" && canExecute && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="text-[12px] text-muted-foreground">
            This project is in draft. You need write access to activate it before running
            research.
          </p>
        </div>
      )}

      {canWrite && project.status !== "archived" && (
        <div
          className={cn(
            "mt-4 border-t border-white/[0.06] pt-4",
            !canExecute && "mt-0 border-t-0 pt-0",
          )}
        >
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
            Archive project
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
            Delete project
          </Button>
        </div>
      )}

      {!canWrite && !canDelete && !canExecute && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this project.
        </p>
      )}
    </DashboardCard>
  );
}
