"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOmnichannelChannel,
  deleteOmnichannelChannel,
  getOmnichannelAnalytics,
  getOmnichannelChannel,
  listOmnichannelChannels,
  updateOmnichannelChannel,
} from "@/lib/api/omnichannel-channels";
import {
  createConversationMessage,
  createOmnichannelConversation,
  getOmnichannelConversation,
  listConversationMessages,
  listInbox,
  requestHumanHandoff,
  suggestAiResponse,
  updateOmnichannelConversation,
} from "@/lib/api/omnichannel-conversations";
import { omnichannelKeys } from "@/lib/omnichannel/query-keys";
import type {
  CreateOmnichannelChannelInput,
  CreateOmnichannelConversationInput,
  CreateOmnichannelMessageInput,
  ListInboxParams,
  UpdateOmnichannelChannelInput,
  UpdateOmnichannelConversationInput,
} from "@/lib/omnichannel/types";

import { useAuthToken } from "./use-auth-token";

export function useOmnichannelAnalytics() {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.analytics(),
    queryFn: () => getOmnichannelAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useOmnichannelChannels() {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.channelList(),
    queryFn: () => listOmnichannelChannels(token!),
    enabled: Boolean(token),
  });
}

export function useOmnichannelChannel(channelId: string) {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.channelDetail(channelId),
    queryFn: () => getOmnichannelChannel(token!, channelId),
    enabled: Boolean(token) && Boolean(channelId),
  });
}

export function useInbox(params?: ListInboxParams) {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.inbox(params),
    queryFn: () => listInbox(token!, params),
    enabled: Boolean(token),
  });
}

export function useOmnichannelConversation(conversationId: string) {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.conversationDetail(conversationId),
    queryFn: () => getOmnichannelConversation(token!, conversationId),
    enabled: Boolean(token) && Boolean(conversationId),
  });
}

export function useConversationMessages(conversationId: string) {
  const token = useAuthToken();
  return useQuery({
    queryKey: omnichannelKeys.messages(conversationId),
    queryFn: () => listConversationMessages(token!, conversationId),
    enabled: Boolean(token) && Boolean(conversationId),
  });
}

export function useCreateOmnichannelChannel() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOmnichannelChannelInput) =>
      createOmnichannelChannel(token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.channels() });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.analytics() });
    },
  });
}

export function useUpdateOmnichannelChannel(channelId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOmnichannelChannelInput) =>
      updateOmnichannelChannel(token!, channelId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.channels() });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.channelDetail(channelId) });
    },
  });
}

export function useCreateOmnichannelConversation() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOmnichannelConversationInput) =>
      createOmnichannelConversation(token!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.all });
    },
  });
}

export function useCreateConversationMessage(conversationId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOmnichannelMessageInput) =>
      createConversationMessage(token!, conversationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: omnichannelKeys.conversationDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.inbox() });
    },
  });
}

export function useSuggestAiResponse(conversationId: string) {
  const token = useAuthToken();
  return useMutation({
    mutationFn: () => suggestAiResponse(token!, conversationId),
  });
}

export function useRequestHumanHandoff(conversationId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requestHumanHandoff(token!, conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: omnichannelKeys.conversationDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.inbox() });
    },
  });
}

export function useUpdateOmnichannelConversation(conversationId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOmnichannelConversationInput) =>
      updateOmnichannelConversation(token!, conversationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: omnichannelKeys.conversationDetail(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: omnichannelKeys.inbox() });
    },
  });
}
