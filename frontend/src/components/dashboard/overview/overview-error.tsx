"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface OverviewErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function OverviewError({
  title = "Could not load dashboard",
  message,
  onRetry,
}: OverviewErrorProps) {
  return (
    <div className="px-6 py-16 md:px-8">
      <DashboardCard
        variant="panel"
        accent="neutral"
        interactive={false}
        className="mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
          <AlertCircle className="size-5 text-destructive" />
        </div>
        <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {message}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )}
      </DashboardCard>
    </div>
  );
}
