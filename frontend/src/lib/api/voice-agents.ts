import { apiClient } from "@/lib/api/client";
import type {
  CreateVoiceAgentInput,
  UpdateVoiceAgentInput,
  VoiceAgent,
  VoiceAgentDetail,
  VoiceAnalytics,
} from "@/lib/voice-ai/types";

const VOICE_AGENTS_BASE = "/api/v1/voice-agents";

export function getVoiceAnalytics(token: string): Promise<VoiceAnalytics> {
  return apiClient<VoiceAnalytics>(`${VOICE_AGENTS_BASE}/analytics`, {
    method: "GET",
    token,
  });
}

export function listVoiceAgents(token: string): Promise<VoiceAgent[]> {
  return apiClient<VoiceAgent[]>(VOICE_AGENTS_BASE, {
    method: "GET",
    token,
  });
}

export function getVoiceAgent(token: string, agentId: string): Promise<VoiceAgentDetail> {
  return apiClient<VoiceAgentDetail>(`${VOICE_AGENTS_BASE}/${agentId}`, {
    method: "GET",
    token,
  });
}

export function createVoiceAgent(
  token: string,
  input: CreateVoiceAgentInput,
): Promise<VoiceAgent> {
  return apiClient<VoiceAgent>(VOICE_AGENTS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateVoiceAgent(
  token: string,
  agentId: string,
  input: UpdateVoiceAgentInput,
): Promise<VoiceAgent> {
  return apiClient<VoiceAgent>(`${VOICE_AGENTS_BASE}/${agentId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteVoiceAgent(token: string, agentId: string): Promise<void> {
  return apiClient<void>(`${VOICE_AGENTS_BASE}/${agentId}`, {
    method: "DELETE",
    token,
  });
}
