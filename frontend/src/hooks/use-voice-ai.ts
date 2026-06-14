"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createVoiceAgent,
  deleteVoiceAgent,
  getVoiceAgent,
  getVoiceAnalytics,
  listVoiceAgents,
  updateVoiceAgent,
} from "@/lib/api/voice-agents";
import {
  createVoiceSession,
  deleteVoiceSession,
  getVoiceSession,
  listSessionTranscripts,
  listVoiceSessions,
  updateVoiceSession,
  uploadVoiceSessionAudio,
} from "@/lib/api/voice-sessions";
import { voiceAiKeys } from "@/lib/voice-ai/query-keys";
import type {
  CreateVoiceAgentInput,
  CreateVoiceSessionInput,
  ListVoiceSessionsParams,
  UpdateVoiceAgentInput,
  UpdateVoiceSessionInput,
} from "@/lib/voice-ai/types";
import { VOICE_SESSION_POLL_MS } from "@/config/voice-ai";

import { useAuthToken } from "./use-auth-token";

export function useVoiceAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.analytics(),
    queryFn: () => getVoiceAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useVoiceAgents() {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.agentList(),
    queryFn: () => listVoiceAgents(token!),
    enabled: Boolean(token),
  });
}

export function useVoiceAgent(agentId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.agentDetail(agentId),
    queryFn: () => getVoiceAgent(token!, agentId),
    enabled: Boolean(token) && Boolean(agentId),
  });
}

export function useVoiceSessions(params?: ListVoiceSessionsParams) {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.sessionList(params),
    queryFn: () => listVoiceSessions(token!, params),
    enabled: Boolean(token),
  });
}

export function useVoiceSession(sessionId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.sessionDetail(sessionId),
    queryFn: () => getVoiceSession(token!, sessionId),
    enabled: Boolean(token) && Boolean(sessionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") {
        return VOICE_SESSION_POLL_MS;
      }
      return false;
    },
  });
}

export function useSessionTranscripts(sessionId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: voiceAiKeys.transcripts(sessionId),
    queryFn: () => listSessionTranscripts(token!, sessionId),
    enabled: Boolean(token) && Boolean(sessionId),
  });
}

export function useCreateVoiceAgent() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVoiceAgentInput) => createVoiceAgent(token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.agents() });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.analytics() });
    },
  });
}

export function useUpdateVoiceAgent(agentId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateVoiceAgentInput) =>
      updateVoiceAgent(token!, agentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.agents() });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.agentDetail(agentId) });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.analytics() });
    },
  });
}

export function useDeleteVoiceAgent() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => deleteVoiceAgent(token!, agentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.all });
    },
  });
}

export function useCreateVoiceSession() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVoiceSessionInput) => createVoiceSession(token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.sessions() });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.analytics() });
    },
  });
}

export function useUpdateVoiceSession(sessionId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateVoiceSessionInput) =>
      updateVoiceSession(token!, sessionId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.sessionDetail(sessionId) });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.sessions() });
    },
  });
}

export function useDeleteVoiceSession() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteVoiceSession(token!, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.all });
    },
  });
}

export function useUploadVoiceSessionAudio(sessionId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadVoiceSessionAudio(token!, sessionId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.sessionDetail(sessionId) });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.transcripts(sessionId) });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.sessions() });
      void queryClient.invalidateQueries({ queryKey: voiceAiKeys.analytics() });
    },
  });
}
