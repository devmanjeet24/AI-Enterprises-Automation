"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { siteConfig } from "@/config/site";
import { omnichannelKeys } from "@/lib/omnichannel/query-keys";
import { useToast } from "@/providers/toast-provider";

export function useOmnichannelRealtime() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (!token) return;

    const source = new EventSource(
      `${siteConfig.apiUrl}/api/v1/omnichannel-realtime/events?token=${encodeURIComponent(token)}`,
    );

    source.addEventListener("update", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          event?: string;
          data?: { message?: string };
        };
        void queryClient.invalidateQueries({ queryKey: omnichannelKeys.all });
        if (payload.data?.message) {
          toast.info(payload.data.message);
        }
      } catch {
        void queryClient.invalidateQueries({ queryKey: omnichannelKeys.all });
      }
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [token, queryClient, toast]);
}
