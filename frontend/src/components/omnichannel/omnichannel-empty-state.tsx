import { Inbox, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

export function OmnichannelEmptyState({
  canCreate = true,
  onCreateClick,
}: {
  canCreate?: boolean;
  onCreateClick?: () => void;
}) {
  const accent = dashboardAccents.purple;
  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="flex flex-col items-center px-6 py-16 text-center">
      <div className={cn("flex size-14 items-center justify-center rounded-2xl border", accent.bgSubtle, accent.border)}>
        <Inbox className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium text-foreground">No channels yet</h3>
      <p className="mt-2 max-w-sm text-[14px] text-muted-foreground">
        Create a channel to start receiving conversations from Website Chat,
        Telegram, Slack, or Internal messaging.
      </p>
      {canCreate && onCreateClick && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Add channel
        </Button>
      )}
    </DashboardCard>
  );
}
