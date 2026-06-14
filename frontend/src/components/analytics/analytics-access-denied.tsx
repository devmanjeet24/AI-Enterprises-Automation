"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface AnalyticsAccessDeniedProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function AnalyticsAccessDenied({
  title = "Access denied",
  message = "You do not have permission to view these analytics. Contact your organization admin if you need access.",
  backHref = "/analytics",
  backLabel = "Back to Analytics",
}: AnalyticsAccessDeniedProps) {
  return (
    <DashboardCard
      variant="panel"
      accent="emerald"
      interactive={false}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
        <ShieldAlert className="size-5 text-amber-400" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{message}</p>
      <Button variant="secondary" size="sm" className="mt-5" asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </DashboardCard>
  );
}
