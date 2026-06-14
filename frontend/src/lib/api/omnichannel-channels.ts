import { apiClient } from "@/lib/api/client";
import type {
  CreateOmnichannelChannelInput,
  OmnichannelAnalytics,
  OmnichannelChannel,
  OmnichannelChannelDetail,
  UpdateOmnichannelChannelInput,
} from "@/lib/omnichannel/types";

const BASE = "/api/v1/omnichannel-channels";

export function getOmnichannelAnalytics(token: string): Promise<OmnichannelAnalytics> {
  return apiClient<OmnichannelAnalytics>(`${BASE}/analytics`, {
    method: "GET",
    token,
  });
}

export function listOmnichannelChannels(token: string): Promise<OmnichannelChannel[]> {
  return apiClient<OmnichannelChannel[]>(BASE, { method: "GET", token });
}

export function getOmnichannelChannel(
  token: string,
  channelId: string,
): Promise<OmnichannelChannelDetail> {
  return apiClient<OmnichannelChannelDetail>(`${BASE}/${channelId}`, {
    method: "GET",
    token,
  });
}

export function createOmnichannelChannel(
  token: string,
  input: CreateOmnichannelChannelInput,
): Promise<OmnichannelChannel> {
  return apiClient<OmnichannelChannel>(BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateOmnichannelChannel(
  token: string,
  channelId: string,
  input: UpdateOmnichannelChannelInput,
): Promise<OmnichannelChannel> {
  return apiClient<OmnichannelChannel>(`${BASE}/${channelId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteOmnichannelChannel(token: string, channelId: string): Promise<void> {
  return apiClient<void>(`${BASE}/${channelId}`, { method: "DELETE", token });
}
