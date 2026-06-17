import type { OmnichannelAnalytics, OmnichannelChannel } from "@/lib/omnichannel/types";

export const channelTypeLabels: Record<string, string> = {
  website_chat: "Website Chat",
  telegram: "Telegram",
  slack: "Slack",
  email: "Email",
  whatsapp: "WhatsApp",
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
