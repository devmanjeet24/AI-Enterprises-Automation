import { Network, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface TeamEmptyStateProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function TeamEmptyState({
  canCreate = true,
  onCreateClick,
}: TeamEmptyStateProps) {
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
        <Network className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        No agent teams yet
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Create a team, assign AI employees with collaboration roles, and run
        sequential multi-agent tasks.
      </p>
      {canCreate && onCreateClick && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Create agent team
        </Button>
      )}
    </DashboardCard>
  );
}
