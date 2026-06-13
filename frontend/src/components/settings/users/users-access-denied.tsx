"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

interface UsersAccessDeniedProps {
  title?: string;
  message?: string;
}

export function UsersAccessDenied({
  title = "Access denied",
  message = "You do not have permission to view user management. Contact your organization administrator if you need access.",
}: UsersAccessDeniedProps) {
  return (
    <DashboardCard
      variant="panel"
      accent="neutral"
      interactive={false}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
        <ShieldAlert className="size-5 text-amber-400" />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{message}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/settings">Back to Settings</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/overview">Back to overview</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
