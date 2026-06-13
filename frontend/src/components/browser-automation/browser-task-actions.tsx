"use client";

import { Archive, CheckCircle2, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useDeleteBrowserTask,
  useUpdateBrowserTask,
} from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  canRunBrowserTask,
  getBrowserRunBlockedMessage,
} from "@/lib/browser-automation/run-messages";
import type { BrowserTaskDetail } from "@/lib/browser-automation/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface BrowserTaskActionsProps {
  task: BrowserTaskDetail;
  canWrite?: boolean;
  canDelete?: boolean;
  canExecute?: boolean;
  onRunClick?: () => void;
}

export function BrowserTaskActions({
  task,
  canWrite = true,
  canDelete = true,
  canExecute = true,
  onRunClick,
}: BrowserTaskActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateBrowserTask(task.id);
  const deleteMutation = useDeleteBrowserTask();
  const [activeAction, setActiveAction] = useState<"ready" | "archive" | "delete" | null>(
    null,
  );

  const canRun = canRunBrowserTask(task, canExecute);
  const runBlockedMessage = getBrowserRunBlockedMessage(task, {
    canExecute,
    canWrite,
  });

  const handleMarkReady = async () => {
    setActiveAction("ready");
    try {
      await updateMutation.mutateAsync({ status: "ready" });
      toast.success("Browser task marked as ready.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to mark task as ready."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleArchive = async () => {
    setActiveAction("archive");
    try {
      await updateMutation.mutateAsync({ status: "archived" });
      toast.success("Browser task archived.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to archive task."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${task.name}"? This will remove all execution history.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(task.id);
      toast.success(`"${task.name}" deleted.`);
      router.push("/browser-automation");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete task."));
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
            Run task
          </Button>
          <p className="text-[12px] text-muted-foreground">
            {canRun
              ? "Execute this task in the linked browser profile."
              : runBlockedMessage}
          </p>
        </div>
      )}

      {canWrite && task.status === "draft" && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={handleMarkReady}
          >
            {activeAction === "ready" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Mark ready
          </Button>
        </div>
      )}

      {!canWrite && task.status === "draft" && canExecute && (
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="text-[12px] text-muted-foreground">
            This task is in draft. You need write access to mark it ready before running.
          </p>
        </div>
      )}

      {canWrite && task.status !== "archived" && (
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
            Archive task
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
            Delete task
          </Button>
        </div>
      )}

      {!canWrite && !canDelete && !canExecute && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this task.
        </p>
      )}
    </DashboardCard>
  );
}
