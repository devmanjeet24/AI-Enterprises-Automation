import { apiClient, apiUpload } from "@/lib/api/client";
import type {
  CreateVoiceSessionInput,
  ListVoiceSessionsParams,
  UpdateVoiceSessionInput,
  VoiceSession,
  VoiceSessionDetail,
  VoiceSessionSummary,
  VoiceTranscript,
} from "@/lib/voice-ai/types";

const VOICE_SESSIONS_BASE = "/api/v1/voice-sessions";

export function listVoiceSessions(
  token: string,
  params?: ListVoiceSessionsParams,
): Promise<VoiceSessionSummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.voice_agent_id) {
    searchParams.set("voice_agent_id", params.voice_agent_id);
  }
  const query = searchParams.toString();
  return apiClient<VoiceSessionSummary[]>(
    `${VOICE_SESSIONS_BASE}${query ? `?${query}` : ""}`,
    { method: "GET", token },
  );
}

export function getVoiceSession(
  token: string,
  sessionId: string,
): Promise<VoiceSessionDetail> {
  return apiClient<VoiceSessionDetail>(`${VOICE_SESSIONS_BASE}/${sessionId}`, {
    method: "GET",
    token,
  });
}

export function createVoiceSession(
  token: string,
  input: CreateVoiceSessionInput,
): Promise<VoiceSession> {
  return apiClient<VoiceSession>(VOICE_SESSIONS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateVoiceSession(
  token: string,
  sessionId: string,
  input: UpdateVoiceSessionInput,
): Promise<VoiceSession> {
  return apiClient<VoiceSession>(`${VOICE_SESSIONS_BASE}/${sessionId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteVoiceSession(token: string, sessionId: string): Promise<void> {
  return apiClient<void>(`${VOICE_SESSIONS_BASE}/${sessionId}`, {
    method: "DELETE",
    token,
  });
}

export function listSessionTranscripts(
  token: string,
  sessionId: string,
): Promise<VoiceTranscript[]> {
  return apiClient<VoiceTranscript[]>(
    `${VOICE_SESSIONS_BASE}/${sessionId}/transcripts`,
    { method: "GET", token },
  );
}

export function uploadVoiceSessionAudio(
  token: string,
  sessionId: string,
  file: File,
): Promise<VoiceSessionDetail> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<VoiceSessionDetail>(
    `${VOICE_SESSIONS_BASE}/${sessionId}/upload`,
    formData,
    { token },
  );
}

export function getVoiceSessionAudioPath(sessionId: string): string {
  return `${VOICE_SESSIONS_BASE}/${sessionId}/audio`;
}

export function getVoiceTranscriptAudioPath(
  sessionId: string,
  transcriptId: string,
): string {
  return `${VOICE_SESSIONS_BASE}/${sessionId}/transcripts/${transcriptId}/audio`;
}
