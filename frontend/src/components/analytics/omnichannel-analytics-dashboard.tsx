"use client";

import { Bot, Handshake, MessageSquare, Radio } from "lucide-react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  buildOmnichannelAnalyticsKpis,
  buildOmnichannelChannelNameChart,
  buildOmnichannelChannelTypeChart,
  buildOmnichannelHandoffChart,
  buildOmnichannelHandlingChart,
  buildOmnichannelMessageRoleChart,
  buildOmnichannelOpenResolvedChart,
  buildOmnichannelStatusChart,
} from "@/config/omnichannel";
import type { OmnichannelAnalytics } from "@/lib/omnichannel/types";

import { AnalyticsBarChart, AnalyticsDistributionChart } from "./analytics-charts";
import { AnalyticsError } from "./analytics-error";
import { AnalyticsKpiGrid } from "./analytics-kpi-grid";
import { AnalyticsKpiSkeleton } from "./analytics-skeleton";

interface OmnichannelAnalyticsDashboardProps {
  analytics?: OmnichannelAnalytics | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  showHeader?: boolean;
}

export function OmnichannelAnalyticsDashboard({
  analytics,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  showHeader = true,
}: OmnichannelAnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-10">
        <AnalyticsKpiSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          <AnalyticsKpiSkeleton />
          <AnalyticsKpiSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <AnalyticsError
        title="Failed to load analytics"
        message={errorMessage ?? "Could not load omnichannel analytics."}
        onRetry={onRetry}
      />
    );
  }

  const kpiItems = buildOmnichannelAnalyticsKpis(analytics).map((item, index) => ({
    label: item.label,
    value: item.value,
    detail: item.detail,
    accent: (["purple", "blue", "emerald", "gold"] as const)[index % 4],
  }));

  return (
    <div className="space-y-10">
      {showHeader && (
        <DashboardSectionHeader
          eyebrow="Analytics"
          title="Omnichannel insights"
          description="Conversation volume, channel mix, message roles, handling mode, and handoff activity."
        />
      )}

      <AnalyticsKpiGrid
        items={kpiItems}
        icons={[MessageSquare, Radio, Bot, Handshake]}
        isLoading={false}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsDistributionChart
          title="Conversations by status"
          subtitle="Lifecycle distribution across active conversations"
          segments={buildOmnichannelStatusChart(analytics)}
          accent="purple"
          emptyMessage="No conversations yet."
        />
        <AnalyticsDistributionChart
          title="Conversations by channel"
          subtitle="Volume grouped by channel type"
          segments={buildOmnichannelChannelTypeChart(analytics)}
          accent="purple"
          emptyMessage="No channel activity yet."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsDistributionChart
          title="Messages by role"
          subtitle="Customer, agent, AI, and system messages"
          segments={buildOmnichannelMessageRoleChart(analytics)}
          accent="blue"
          emptyMessage="No messages recorded yet."
        />
        <AnalyticsBarChart
          title="AI vs human handled"
          subtitle="Active conversations by handling mode"
          segments={buildOmnichannelHandlingChart(analytics)}
          accent="purple"
          emptyMessage="No active handling data yet."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsBarChart
          title="Open vs resolved"
          subtitle="Active threads compared to completed conversations"
          segments={buildOmnichannelOpenResolvedChart(analytics)}
          accent="emerald"
          emptyMessage="No conversation outcomes yet."
        />
        <AnalyticsDistributionChart
          title="Handoff metrics"
          subtitle="Handoff requests, assignments, and completions"
          segments={buildOmnichannelHandoffChart(analytics)}
          accent="gold"
          emptyMessage="No handoff activity yet."
        />
      </div>

      {buildOmnichannelChannelNameChart(analytics).length > 0 && (
        <AnalyticsBarChart
          title="Top channels by volume"
          subtitle="Named channels with the most conversations"
          segments={buildOmnichannelChannelNameChart(analytics)}
          accent="purple"
          emptyMessage="No channel data yet."
        />
      )}
    </div>
  );
}
