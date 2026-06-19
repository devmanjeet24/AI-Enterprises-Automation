"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { siteConfig } from "@/config/site";
import { omnichannelKeys } from "@/lib/omnichannel/query-keys";
import { useToast } from "@/providers/toast-provider";

type RealtimePayload = {
  event?: string;
  data?: {
    conversation_id?: string;
    message?: string;
  };
};

const RECONNECT_DELAY_MS = 3000;

function buildRealtimeUrl(token: string): string {
  const base = siteConfig.realtimeApiUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ token });
  if (base.includes("ngrok")) {
    params.set("ngrok-skip-browser-warning", "true");
  }
  return `${base}/api/v1/omnichannel-realtime/events?${params.toString()}`;
}

export function useOmnichannelRealtime(options?: { conversationId?: string }) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const toast = useToast();
  const conversationId = options?.conversationId;

  useEffect(() => {
    if (!token) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const refreshQueries = (payload: RealtimePayload) => {
      const eventConversationId = payload.data?.conversation_id;

      void queryClient.refetchQueries({ queryKey: omnichannelKeys.all, type: "active" });

      if (eventConversationId) {
        void queryClient.refetchQueries({
          queryKey: omnichannelKeys.conversationDetail(eventConversationId),
          type: "active",
        });
      } else if (conversationId) {
        void queryClient.refetchQueries({
          queryKey: omnichannelKeys.conversationDetail(conversationId),
          type: "active",
        });
      }

      void queryClient.refetchQueries({ queryKey: omnichannelKeys.inbox(), type: "active" });
    };

    const handleUpdate = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as RealtimePayload;
        refreshQueries(payload);
        if (payload.data?.message) {
          toast.info(payload.data.message);
        }
      } catch {
        refreshQueries({});
      }
    };

    const connect = () => {
      if (disposed) return;

      source = new EventSource(buildRealtimeUrl(token));
      source.addEventListener("update", handleUpdate);
      source.onerror = () => {
        source?.close();
        source = null;
        if (!disposed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [token, queryClient, toast, conversationId]);
}
