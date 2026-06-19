"use client";

import { useQuery } from "@tanstack/react-query";

import { getVoiceTranscriptAudioPath } from "@/lib/api/voice-sessions";
import { apiDownload } from "@/lib/api/client";

import { useAuthToken } from "./use-auth-token";

export function useVoiceTranscriptAudio(
  sessionId: string,
  transcriptId: string,
  enabled: boolean,
) {
  const token = useAuthToken();

  return useQuery({
    queryKey: ["voice-transcript-audio", sessionId, transcriptId],
    queryFn: async () => {
      const { blob } = await apiDownload(
        getVoiceTranscriptAudioPath(sessionId, transcriptId),
        { token: token! },
      );
      return URL.createObjectURL(blob);
    },
    enabled: Boolean(token) && enabled,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}
