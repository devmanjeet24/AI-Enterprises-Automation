"use client";

import { AlertCircle, Inbox, MessageSquare, Radio } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeOmnichannelStats } from "@/config/omnichannel";
import type { OmnichannelAnalytics, OmnichannelChannel } from "@/lib/omnichannel/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelStatsSkeleton } from "./omnichannel-skeleton";

interface OmnichannelStatsProps {
  channels: OmnichannelChannel[];
  analytics?: OmnichannelAnalytics | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function OmnichannelStats({
  channels,
  analytics,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: OmnichannelStatsProps) {
  if (isLoading) return <OmnichannelStatsSkeleton />;
  if (isError) {
    return (
      <OmnichannelError
        title="Failed to load analytics"
        message={errorMessage ?? "Could not load omnichannel metrics."}
        onRetry={onRetry}
      />
    );
  }

  const computed = computeOmnichannelStats(channels, analytics);
  const accent = dashboardAccents.purple;
  const stats = [
    { label: "Channels", value: computed.totalChannels, icon: Radio },
    { label: "Active", value: computed.activeChannels, icon: Inbox },
    { label: "Open", value: computed.openConversations, icon: MessageSquare },
    { label: "Handoffs", value: computed.pendingHandoffs, icon: AlertCircle },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.label} variant="panel" accent="purple" className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {stat.value ?? "—"}
              </p>
            </div>
            <div className={cn("flex size-9 items-center justify-center rounded-lg border", accent.bgSubtle, accent.border)}>
              <stat.icon className={cn("size-4", accent.text)} />
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}
