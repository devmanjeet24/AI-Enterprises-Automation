"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface DepartmentsErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function DepartmentsError({
  title = "Something went wrong",
  message,
  onRetry,
}: DepartmentsErrorProps) {
  return (
    <DashboardCard
      variant="panel"
      accent="blue"
      interactive={false}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </DashboardCard>
  );
}
