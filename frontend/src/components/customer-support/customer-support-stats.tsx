"use client";

import { Clock, Headphones, MessageSquare, UserX } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeSupportStats } from "@/config/customer-support";
import type { SupportAnalytics, SupportTicket } from "@/lib/customer-support/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CustomerSupportError } from "./customer-support-error";
import { CustomerSupportStatsSkeleton } from "./customer-support-skeleton";

interface CustomerSupportStatsProps {
  tickets: SupportTicket[];
  analytics?: SupportAnalytics | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function formatMetricValue(value: number | null): string {
  return value == null ? "—" : String(value);
}

export function CustomerSupportStats({
  tickets,
  analytics,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: CustomerSupportStatsProps) {
  if (isLoading) return <CustomerSupportStatsSkeleton />;

  if (isError) {
    return (
      <CustomerSupportError
        title="Failed to load support analytics"
        message={errorMessage ?? "Could not load ticket metrics."}
        onRetry={onRetry}
      />
    );
  }

  const computed = computeSupportStats(tickets, analytics);
  const accent = dashboardAccents.blue;

  const stats = [
    {
      label: "Total tickets",
      value: formatMetricValue(computed.total),
      icon: Headphones,
    },
    {
      label: "Open",
      value: formatMetricValue(computed.open),
      icon: MessageSquare,
    },
    {
      label: "In progress",
      value: formatMetricValue(computed.inProgress),
      icon: Clock,
    },
    {
      label: "Unassigned",
      value: formatMetricValue(computed.unassigned),
      icon: UserX,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.label} variant="panel" accent="blue" className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <stat.icon className={cn("size-4", accent.text)} />
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}
