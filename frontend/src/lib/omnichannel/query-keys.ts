import type { ListInboxParams } from "@/lib/omnichannel/types";

export const omnichannelKeys = {
  all: ["omnichannel"] as const,
  channels: () => [...omnichannelKeys.all, "channels"] as const,
  channelList: () => [...omnichannelKeys.channels(), "list"] as const,
  channelDetail: (id: string) => [...omnichannelKeys.channels(), "detail", id] as const,
  analytics: () => [...omnichannelKeys.all, "analytics"] as const,
  inbox: (params?: ListInboxParams) =>
    [...omnichannelKeys.all, "inbox", params ?? {}] as const,
  conversations: () => [...omnichannelKeys.all, "conversations"] as const,
  conversationDetail: (id: string) =>
    [...omnichannelKeys.conversations(), "detail", id] as const,
  messages: (conversationId: string) =>
    [...omnichannelKeys.conversations(), "messages", conversationId] as const,
};
