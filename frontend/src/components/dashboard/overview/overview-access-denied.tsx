"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface OverviewAccessDeniedProps {
  title?: string;
  message?: string;
}

export function OverviewAccessDenied({
  title = "Access denied",
  message = "You do not have permission to view the workspace overview. Contact your organization administrator if you need access.",
}: OverviewAccessDeniedProps) {
  return (
    <div className="px-6 py-16 md:px-8">
      <DashboardCard
        variant="panel"
        accent="gold"
        interactive={false}
        className="mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
          <ShieldAlert className="size-5 text-amber-400" />
        </div>
        <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{message}</p>
        <Button variant="secondary" size="sm" className="mt-5" asChild>
          <Link href="/settings">Go to settings</Link>
        </Button>
      </DashboardCard>
    </div>
  );
}
