"use client";

import { CheckCircle2, CircleOff, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useDeleteBrowserProfile,
  useUpdateBrowserProfile,
} from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BrowserProfile } from "@/lib/browser-automation/types";
import { useToast } from "@/providers/toast-provider";

interface BrowserProfileActionsProps {
  profile: BrowserProfile;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function BrowserProfileActions({
  profile,
  canWrite = true,
  canDelete = true,
}: BrowserProfileActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateMutation = useUpdateBrowserProfile(profile.id);
  const deleteMutation = useDeleteBrowserProfile();
  const [activeAction, setActiveAction] = useState<"activate" | "deactivate" | "delete" | null>(
    null,
  );

  const handleToggleActive = async () => {
    const nextActive = !profile.is_active;
    setActiveAction(nextActive ? "activate" : "deactivate");
    try {
      await updateMutation.mutateAsync({ is_active: nextActive });
      toast.success(
        nextActive ? "Browser profile activated." : "Browser profile deactivated.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          nextActive ? "Failed to activate profile." : "Failed to deactivate profile.",
        ),
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${profile.name}"? Linked tasks may be affected.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(profile.id);
      toast.success(`"${profile.name}" deleted.`);
      router.push("/browser-automation");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete profile."));
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
            ) : profile.is_active ? (
              <CircleOff className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            {profile.is_active ? "Deactivate profile" : "Activate profile"}
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
            Delete profile
          </Button>
        </div>
      )}

      {!canWrite && !canDelete && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          You have read-only access to this profile.
        </p>
      )}
    </DashboardCard>
  );
}
