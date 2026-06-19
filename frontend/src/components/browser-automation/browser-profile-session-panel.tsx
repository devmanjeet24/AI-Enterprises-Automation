"use client";

import { KeyRound, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/browser-automation";
import { useClearBrowserProfileSession } from "@/hooks/use-browser-automation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { BrowserProfile } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface BrowserProfileSessionPanelProps {
  profile: BrowserProfile;
  canWrite?: boolean;
}

export function BrowserProfileSessionPanel({
  profile,
  canWrite = true,
}: BrowserProfileSessionPanelProps) {
  const accent = dashboardAccents.blue;
  const toast = useToast();
  const clearSessionMutation = useClearBrowserProfileSession(profile.id);

  const handleClearSession = async () => {
    try {
      await clearSessionMutation.mutateAsync();
      toast.success("Persisted browser session cleared.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to clear browser session."));
    }
  };

  const persistenceLabel = profile.session_persistence_enabled ? "Enabled" : "Disabled";
  const storedLabel = profile.session_stored ? "Stored" : "Not stored";

  return (
    <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border",
              accent.bgSubtle,
              accent.border,
            )}
          >
            <KeyRound className={cn("size-5", accent.text)} />
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Session persistence
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Cookies and localStorage are saved locally per profile after each successful run.
            </p>
          </div>
        </div>
        {canWrite && profile.session_stored && (
          <Button
            variant="secondary"
            size="sm"
            disabled={clearSessionMutation.isPending}
            onClick={handleClearSession}
          >
            {clearSessionMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Clear session
          </Button>
        )}
      </div>

      <dl className="mt-5 space-y-3 text-[13px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Persistence</dt>
          <dd className="font-medium text-foreground">{persistenceLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Saved session</dt>
          <dd className="font-medium text-foreground">{storedLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Last saved</dt>
          <dd className="font-medium text-foreground">
            {profile.session_updated_at ? formatDateTime(profile.session_updated_at) : "—"}
          </dd>
        </div>
      </dl>
    </DashboardCard>
  );
}
