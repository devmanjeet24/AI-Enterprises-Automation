"use client";

import { CheckCircle2, CircleOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useDeleteTeam, useUpdateTeam } from "@/hooks/use-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Team } from "@/lib/teams/types";
import { useToast } from "@/providers/toast-provider";

interface TeamActionsProps {
  team: Team;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function TeamActions({ team, canWrite = true, canDelete = true }: TeamActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateTeam(team.id);
  const deleteMutation = useDeleteTeam();
  const [activeAction, setActiveAction] = useState<
    "activate" | "deactivate" | "delete" | null
  >(null);

  const handleToggleActive = async () => {
    const nextActive = !team.is_active;
    setActiveAction(nextActive ? "activate" : "deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: nextActive });
      toast.success(nextActive ? "Team activated." : "Team deactivated.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          nextActive ? "Failed to activate team." : "Failed to deactivate team.",
        ),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${team.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(team.id);
      toast.success(`"${team.name}" deleted.`);
      router.push("/settings/teams");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete team."));
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
            ) : team.is_active ? (
              <CircleOff className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {team.is_active ? "Deactivate team" : "Activate team"}
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
            Delete team
          </Button>
        </div>
      )}

      {!canWrite && !canDelete && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this team.
        </p>
      )}
    </DashboardCard>
  );
}
