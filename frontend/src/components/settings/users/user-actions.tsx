"use client";

import { Loader2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { useUpdateUser, useUsers } from "@/hooks/use-users";
import { useAuthUser } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getDeactivateBlockedMessage } from "@/lib/users/guards";
import type { User } from "@/lib/users/types";
import { useToast } from "@/providers/toast-provider";

interface UserActionsProps {
  user: User;
  canWrite?: boolean;
}

export function UserActions({ user, canWrite = true }: UserActionsProps) {
  const toast = useToast();
  const currentUser = useAuthUser();
  const updateMutation = useUpdateUser(user.id);
  const { data: allUsers = [] } = useUsers();
  const [activeAction, setActiveAction] = useState<"activate" | "deactivate" | null>(null);

  const deactivateBlockedMessage = getDeactivateBlockedMessage(
    user,
    allUsers,
    currentUser?.id,
  );

  const handleActivate = async () => {
    setActiveAction("activate");
    try {
      await updateMutation.mutateAsync({ is_active: true });
      toast.success("User account activated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to activate user."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeactivate = async () => {
    if (deactivateBlockedMessage) {
      toast.error(deactivateBlockedMessage);
      return;
    }

    const confirmed = window.confirm(
      `Deactivate "${user.first_name} ${user.last_name}"? They will lose access to the workspace.`,
    );
    if (!confirmed) return;

    setActiveAction("deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: false });
      toast.success("User account deactivated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to deactivate user."));
    } finally {
      setActiveAction(null);
    }
  };

  const isBusy = activeAction !== null || updateMutation.isPending;

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Actions
      </p>

      {canWrite ? (
        <div className="mt-4 flex flex-col gap-2">
          {user.is_active ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                disabled={isBusy || Boolean(deactivateBlockedMessage)}
                onClick={handleDeactivate}
              >
                {activeAction === "deactivate" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UserX className="size-3.5" />
                )}
                Deactivate user
              </Button>
              {deactivateBlockedMessage && (
                <p className="text-[12px] text-muted-foreground">{deactivateBlockedMessage}</p>
              )}
            </>
          ) : (
            <Button
              variant="brand"
              size="sm"
              className="w-full justify-start"
              disabled={isBusy}
              onClick={handleActivate}
            >
              {activeAction === "activate" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserCheck className="size-3.5" />
              )}
              Activate user
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this user account.
        </p>
      )}
    </DashboardCard>
  );
}
