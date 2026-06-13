import { KeyRound, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface PermissionsEmptyStateProps {
  title?: string;
  description?: string;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function PermissionsEmptyState({
  title = "No permissions yet",
  description = "Create a custom permission or wait for the default catalog to be seeded for your organization.",
  canCreate = false,
  onCreateClick,
}: PermissionsEmptyStateProps) {
  const accent = dashboardAccents.purple;

  return (
    <DashboardCard
      variant="panel"
      accent="purple"
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
        <KeyRound className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {canCreate && onCreateClick && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onCreateClick}>
          <Plus className="size-3.5" />
          Create permission
        </Button>
      )}
    </DashboardCard>
  );
}
