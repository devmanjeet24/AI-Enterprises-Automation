import { Globe, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserTasksEmptyStateProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
  hasProfiles?: boolean;
}

export function BrowserTasksEmptyState({
  canCreate = true,
  onCreateClick,
  hasProfiles = true,
}: BrowserTasksEmptyStateProps) {
  const accent = dashboardAccents.blue;

  return (
    <DashboardCard
      variant="panel"
      accent="blue"
      interactive={false}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl border",
          accent.bgSubtle,
          accent.border,
        )}
      >
        <Globe className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        No browser tasks yet
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {hasProfiles
          ? "Define web automation tasks with a target URL and instructions, then mark them ready to run."
          : "Create a browser profile first, then define tasks that use it for web automation."}
      </p>
      {canCreate && onCreateClick && hasProfiles && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Create task
        </Button>
      )}
    </DashboardCard>
  );
}
