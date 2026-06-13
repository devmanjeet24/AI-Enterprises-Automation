import { apiClient } from "@/lib/api/client";
import type { Organization, UpdateOrganizationInput } from "@/lib/settings/types";

const ORGANIZATIONS_BASE = "/api/v1/organizations";

export function getOrganization(token: string): Promise<Organization> {
  return apiClient<Organization>(`${ORGANIZATIONS_BASE}/me`, {
    method: "GET",
    token,
  });
}

export function updateOrganization(
  token: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return apiClient<Organization>(`${ORGANIZATIONS_BASE}/me`, {
    method: "PATCH",
    token,
    body: input,
  });
}
