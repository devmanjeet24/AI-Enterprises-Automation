import { Globe, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserProfilesEmptyStateProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function BrowserProfilesEmptyState({
  canCreate = true,
  onCreateClick,
}: BrowserProfilesEmptyStateProps) {
  const accent = dashboardAccents.blue;

  return (
    <DashboardCard
      variant="panel"
      accent="blue"
      interactive={false}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl border",
          accent.bgSubtle,
          accent.border,
        )}
      >
        <Globe className={cn("size-5", accent.text)} />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">No browser profiles yet</h3>
      <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
        Create a managed browser profile with viewport and user-agent settings before defining
        automation tasks.
      </p>
      {canCreate && onCreateClick && (
        <Button variant="brand" size="sm" className="mt-5" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Create profile
        </Button>
      )}
    </DashboardCard>
  );
}
