import type { ListVoiceSessionsParams } from "@/lib/voice-ai/types";

export const voiceAiKeys = {
  all: ["voice-ai"] as const,
  agents: () => [...voiceAiKeys.all, "agents"] as const,
  agentList: () => [...voiceAiKeys.agents(), "list"] as const,
  agentDetail: (id: string) => [...voiceAiKeys.agents(), "detail", id] as const,
  analytics: () => [...voiceAiKeys.all, "analytics"] as const,
  sessions: () => [...voiceAiKeys.all, "sessions"] as const,
  sessionList: (params?: ListVoiceSessionsParams) =>
    [...voiceAiKeys.sessions(), "list", params ?? {}] as const,
  sessionDetail: (id: string) => [...voiceAiKeys.sessions(), "detail", id] as const,
  transcripts: (sessionId: string) =>
    [...voiceAiKeys.sessions(), "transcripts", sessionId] as const,
};
