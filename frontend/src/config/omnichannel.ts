import type { OmnichannelAnalytics, OmnichannelChannel } from "@/lib/omnichannel/types";
import type { AnalyticsChartSegment } from "@/lib/analytics/types";
import { percentOf } from "@/lib/analytics/compute/utils";
import type { DashboardAccent } from "@/lib/dashboard-accents";

export const channelTypeLabels: Record<string, string> = {
  website_chat: "Website Chat",
  telegram: "Telegram",
  slack: "Slack",
  email: "Email",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  internal: "Internal",
};

export const conversationStatusLabels: Record<string, string> = {
  open: "Open",
  ai_handling: "AI Handling",
  waiting_human: "Waiting Human",
  resolved: "Resolved",
  closed: "Closed",
};

export const handoffStatusLabels: Record<string, string> = {
  none: "None",
  requested: "Requested",
  assigned: "Assigned",
  completed: "Completed",
};

export const messageRoleLabels: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
  ai_assistant: "AI Assistant",
  system: "System",
};

const conversationStatusAccents: Record<string, DashboardAccent> = {
  open: "blue",
  ai_handling: "purple",
  waiting_human: "gold",
  resolved: "emerald",
  closed: "neutral",
};

const channelTypeAccents: Record<string, DashboardAccent> = {
  website_chat: "purple",
  telegram: "blue",
  slack: "emerald",
  email: "gold",
  whatsapp: "emerald",
  linkedin: "blue",
  internal: "neutral",
};

const messageRoleAccents: Record<string, DashboardAccent> = {
  customer: "blue",
  agent: "emerald",
  ai_assistant: "purple",
  system: "neutral",
};

const handoffStatusAccents: Record<string, DashboardAccent> = {
  none: "neutral",
  requested: "gold",
  assigned: "blue",
  completed: "emerald",
};

export function formatAnalyticsValue(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export function buildOmnichannelStatusChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics?.conversations_by_status) return [];

  return Object.entries(analytics.conversations_by_status)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value]) => ({
      key,
      label: conversationStatusLabels[key] ?? key,
      value,
      accent: conversationStatusAccents[key] ?? "neutral",
    }));
}

export function buildOmnichannelChannelTypeChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics?.conversations_by_channel_type) return [];

  return Object.entries(analytics.conversations_by_channel_type)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value]) => ({
      key,
      label: channelTypeLabels[key] ?? key,
      value,
      accent: channelTypeAccents[key] ?? "neutral",
    }));
}

export function buildOmnichannelChannelNameChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics?.conversations_by_channel) return [];

  const accents: DashboardAccent[] = ["purple", "blue", "emerald", "gold", "neutral"];

  return Object.entries(analytics.conversations_by_channel)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
    .map(([key, value], index) => ({
      key,
      label: key,
      value,
      accent: accents[index % accents.length],
    }));
}

export function buildOmnichannelMessageRoleChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics?.messages_by_role) return [];

  return Object.entries(analytics.messages_by_role)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value]) => ({
      key,
      label: messageRoleLabels[key] ?? key,
      value,
      accent: messageRoleAccents[key] ?? "neutral",
    }));
}

export function buildOmnichannelHandlingChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  return [
    {
      key: "ai",
      label: "AI handled",
      value: analytics.ai_handled_conversations ?? 0,
      accent: "purple" as const,
    },
    {
      key: "human",
      label: "Human handled",
      value: analytics.human_handled_conversations ?? 0,
      accent: "emerald" as const,
    },
  ].filter((segment) => segment.value > 0);
}

export function buildOmnichannelOpenResolvedChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics) return [];

  const byStatus = analytics.conversations_by_status ?? {};
  const openCount =
    (byStatus.open ?? 0) +
    (byStatus.ai_handling ?? 0) +
    (byStatus.waiting_human ?? 0);
  const resolvedCount = (byStatus.resolved ?? 0) + (byStatus.closed ?? 0);

  return [
    { key: "open", label: "Open / active", value: openCount, accent: "blue" as const },
    {
      key: "resolved",
      label: "Resolved / closed",
      value: resolvedCount,
      accent: "emerald" as const,
    },
  ].filter((segment) => segment.value > 0);
}

export function buildOmnichannelHandoffChart(
  analytics?: OmnichannelAnalytics | null,
): AnalyticsChartSegment[] {
  if (!analytics?.handoffs_by_status) return [];

  return Object.entries(analytics.handoffs_by_status)
    .sort(([, left], [, right]) => right - left)
    .map(([key, value]) => ({
      key,
      label: handoffStatusLabels[key] ?? key,
      value,
      accent: handoffStatusAccents[key] ?? "neutral",
    }));
}

export function buildOmnichannelAnalyticsKpis(
  analytics?: OmnichannelAnalytics | null,
): { label: string; value: string; detail: string }[] {
  if (!analytics) {
    return [
      { label: "Conversations", value: "—", detail: "Total active threads" },
      { label: "Messages", value: "—", detail: "Across all channels" },
      { label: "AI handled", value: "—", detail: "Active AI conversations" },
      { label: "Pending handoffs", value: "—", detail: "Awaiting human agent" },
    ];
  }

  const byStatus = analytics.conversations_by_status ?? {};
  const openCount =
    (byStatus.open ?? 0) +
    (byStatus.ai_handling ?? 0) +
    (byStatus.waiting_human ?? 0);

  return [
    {
      label: "Conversations",
      value: formatAnalyticsValue(analytics.total_conversations),
      detail: `${formatAnalyticsValue(openCount)} open · ${formatAnalyticsValue(analytics.recent_conversations_7d)} new (7d)`,
    },
    {
      label: "Messages",
      value: formatAnalyticsValue(analytics.total_messages),
      detail: `${formatAnalyticsValue(analytics.active_channels)} active channels`,
    },
    {
      label: "AI handled",
      value: formatAnalyticsValue(analytics.ai_handled_conversations),
      detail: `${formatAnalyticsValue(analytics.human_handled_conversations)} human handled`,
    },
    {
      label: "Pending handoffs",
      value: formatAnalyticsValue(analytics.pending_handoffs),
      detail: `${percentOf(analytics.pending_handoffs, analytics.total_conversations)}% of conversations`,
    },
  ];
}

export function buildOmnichannelHeroStats(analytics?: OmnichannelAnalytics | null) {
  if (!analytics) {
    return [
      { label: "Channels", value: "—" },
      { label: "Conversations", value: "—" },
      { label: "Messages", value: "—" },
      { label: "Handoffs", value: "—" },
    ];
  }

  return [
    { label: "Channels", value: formatAnalyticsValue(analytics.total_channels) },
    { label: "Conversations", value: formatAnalyticsValue(analytics.total_conversations) },
    { label: "Messages", value: formatAnalyticsValue(analytics.total_messages) },
    { label: "Handoffs", value: formatAnalyticsValue(analytics.pending_handoffs) },
  ];
}

export function slugifyOmnichannelName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString();
}

export interface OmnichannelStats {
  totalChannels: number | null;
  activeChannels: number | null;
  openConversations: number | null;
  pendingHandoffs: number | null;
}

export function computeOmnichannelStats(
  channels: OmnichannelChannel[],
  analytics?: OmnichannelAnalytics | null,
): OmnichannelStats {
  if (analytics) {
    return {
      totalChannels: analytics.total_channels,
      activeChannels: analytics.active_channels,
      openConversations: analytics.open_conversations,
      pendingHandoffs: analytics.pending_handoffs,
    };
  }
  return {
    totalChannels: channels.length,
    activeChannels: channels.filter((c) => c.is_active).length,
    openConversations: null,
    pendingHandoffs: null,
  };
}
