import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface AiEmployeesErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function AiEmployeesError({
  title = "Something went wrong",
  message,
  onRetry,
}: AiEmployeesErrorProps) {
  return (
    <DashboardCard
      variant="panel"
      accent="emerald"
      interactive={false}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" />
      </div>
      <h3 className="mt-4 text-[16px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      )}
    </DashboardCard>
  );
}
