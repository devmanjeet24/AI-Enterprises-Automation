"use client";

import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useDeleteAgentTeam, useUpdateAgentTeam } from "@/hooks/use-agent-teams";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AgentTeamDetail } from "@/lib/agent-teams/types";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface TeamDetailActionsProps {
  team: AgentTeamDetail;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function TeamDetailActions({
  team,
  canWrite = true,
  canDelete = true,
}: TeamDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateAgentTeam(team.id);
  const deleteMutation = useDeleteAgentTeam();
  const [isActive, setIsActive] = useState(team.is_active);
  const [activeAction, setActiveAction] = useState<"toggle" | "delete" | null>(
    null,
  );

  useEffect(() => {
    setIsActive(team.is_active);
  }, [team.is_active, team.updated_at]);

  const handleToggle = async () => {
    setActiveAction("toggle");
    try {
      const updated = await updateMutation.mutateAsync({ is_active: !isActive });
      setIsActive(updated.is_active);
      toast.success(
        updated.is_active ? "Team activated." : "Team deactivated.",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update team status."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${team.name}"? This will remove all members and task history.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(team.id);
      toast.success(`"${team.name}" deleted.`);
      router.push("/agent-teams");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete team."));
      setActiveAction(null);
    }
  };

  const isBusy =
    activeAction !== null ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="blue" interactive={false} className="p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Status & actions
      </p>

      {canWrite && (
        <div className="mt-4 flex flex-col gap-2">
          {isActive ? (
            <Button
              variant="secondary"
              size="sm"
              className="justify-start"
              disabled={isBusy}
              onClick={handleToggle}
            >
              {activeAction === "toggle" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PowerOff className="size-3.5" />
              )}
              Deactivate team
            </Button>
          ) : (
            <Button
              variant="brand"
              size="sm"
              className="justify-start"
              disabled={isBusy}
              onClick={handleToggle}
            >
              {activeAction === "toggle" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Power className="size-3.5" />
              )}
              Activate team
            </Button>
          )}
          <p className="text-[12px] text-muted-foreground">
            {isActive
              ? "Active teams can submit and run tasks."
              : "Inactive teams cannot execute tasks."}
          </p>
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
            Delete team
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
