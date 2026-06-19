import { apiClient } from "@/lib/api/client";
import type {
  BrowserProfile,
  CreateBrowserProfileInput,
  UpdateBrowserProfileInput,
} from "@/lib/browser-automation/types";

const BROWSER_PROFILES_BASE = "/api/v1/browser-profiles";

export function listBrowserProfiles(token: string): Promise<BrowserProfile[]> {
  return apiClient<BrowserProfile[]>(BROWSER_PROFILES_BASE, {
    method: "GET",
    token,
  });
}

export function getBrowserProfile(
  token: string,
  profileId: string,
): Promise<BrowserProfile> {
  return apiClient<BrowserProfile>(`${BROWSER_PROFILES_BASE}/${profileId}`, {
    method: "GET",
    token,
  });
}

export function createBrowserProfile(
  token: string,
  input: CreateBrowserProfileInput,
): Promise<BrowserProfile> {
  return apiClient<BrowserProfile>(BROWSER_PROFILES_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateBrowserProfile(
  token: string,
  profileId: string,
  input: UpdateBrowserProfileInput,
): Promise<BrowserProfile> {
  return apiClient<BrowserProfile>(`${BROWSER_PROFILES_BASE}/${profileId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteBrowserProfile(token: string, profileId: string): Promise<void> {
  return apiClient<void>(`${BROWSER_PROFILES_BASE}/${profileId}`, {
    method: "DELETE",
    token,
  });
}

export function clearBrowserProfileSession(
  token: string,
  profileId: string,
): Promise<BrowserProfile> {
  return apiClient<BrowserProfile>(`${BROWSER_PROFILES_BASE}/${profileId}/session`, {
    method: "DELETE",
    token,
  });
}
