"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export function OmnichannelError({
  title = "Something went wrong",
  message = "An unexpected error occurred.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
        <AlertCircle className="size-5 text-red-400" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </DashboardCard>
  );
}
