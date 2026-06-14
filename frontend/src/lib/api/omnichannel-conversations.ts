import { apiClient } from "@/lib/api/client";
import type {
  CreateOmnichannelConversationInput,
  CreateOmnichannelMessageInput,
  ListInboxParams,
  OmnichannelAiSuggestion,
  OmnichannelConversation,
  OmnichannelConversationDetail,
  OmnichannelInboxItem,
  OmnichannelMessage,
  UpdateOmnichannelConversationInput,
} from "@/lib/omnichannel/types";

const BASE = "/api/v1/omnichannel-conversations";

export function listInbox(
  token: string,
  params?: ListInboxParams,
): Promise<OmnichannelInboxItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.channel_id) searchParams.set("channel_id", params.channel_id);
  if (params?.channel_type) searchParams.set("channel_type", params.channel_type);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.unassigned_only) searchParams.set("unassigned_only", "true");
  const query = searchParams.toString();
  return apiClient<OmnichannelInboxItem[]>(
    `${BASE}/inbox${query ? `?${query}` : ""}`,
    { method: "GET", token },
  );
}

export function getOmnichannelConversation(
  token: string,
  conversationId: string,
): Promise<OmnichannelConversationDetail> {
  return apiClient<OmnichannelConversationDetail>(`${BASE}/${conversationId}`, {
    method: "GET",
    token,
  });
}

export function createOmnichannelConversation(
  token: string,
  input: CreateOmnichannelConversationInput,
): Promise<OmnichannelConversation> {
  return apiClient<OmnichannelConversation>(BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateOmnichannelConversation(
  token: string,
  conversationId: string,
  input: UpdateOmnichannelConversationInput,
): Promise<OmnichannelConversation> {
  return apiClient<OmnichannelConversation>(`${BASE}/${conversationId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteOmnichannelConversation(
  token: string,
  conversationId: string,
): Promise<void> {
  return apiClient<void>(`${BASE}/${conversationId}`, {
    method: "DELETE",
    token,
  });
}

export function listConversationMessages(
  token: string,
  conversationId: string,
): Promise<OmnichannelMessage[]> {
  return apiClient<OmnichannelMessage[]>(`${BASE}/${conversationId}/messages`, {
    method: "GET",
    token,
  });
}

export function createConversationMessage(
  token: string,
  conversationId: string,
  input: CreateOmnichannelMessageInput,
): Promise<OmnichannelMessage> {
  return apiClient<OmnichannelMessage>(`${BASE}/${conversationId}/messages`, {
    method: "POST",
    token,
    body: input,
  });
}

export function suggestAiResponse(
  token: string,
  conversationId: string,
): Promise<OmnichannelAiSuggestion> {
  return apiClient<OmnichannelAiSuggestion>(
    `${BASE}/${conversationId}/suggest-response`,
    { method: "POST", token },
  );
}

export function requestHumanHandoff(
  token: string,
  conversationId: string,
): Promise<OmnichannelConversation> {
  return apiClient<OmnichannelConversation>(`${BASE}/${conversationId}/handoff`, {
    method: "POST",
    token,
  });
}
