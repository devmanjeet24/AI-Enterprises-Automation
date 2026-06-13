import { Users } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface UsersEmptyStateProps {
  title?: string;
  description?: string;
}

export function UsersEmptyState({
  title = "No users found",
  description = "There are no user accounts in your organization yet.",
}: UsersEmptyStateProps) {
  const accent = dashboardAccents.emerald;

  return (
    <DashboardCard
      variant="panel"
      accent="emerald"
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
        <Users className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </DashboardCard>
  );
}
