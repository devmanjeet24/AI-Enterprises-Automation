import { Headphones, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface CustomerSupportEmptyStateProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function CustomerSupportEmptyState({
  canCreate = true,
  onCreateClick,
}: CustomerSupportEmptyStateProps) {
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
        <Headphones className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        No support tickets yet
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Track customer issues, assign agents and AI employees, and manage
        conversations from one place.
      </p>
      {canCreate && onCreateClick && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Create ticket
        </Button>
      )}
    </DashboardCard>
  );
}
