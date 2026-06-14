import { apiClient } from "@/lib/api/client";
import type {
  CreateSupportCategoryInput,
  SupportCategory,
  UpdateSupportCategoryInput,
} from "@/lib/customer-support/types";

const SUPPORT_CATEGORIES_BASE = "/api/v1/support-categories";

export function listSupportCategories(
  token: string,
  activeOnly = false,
): Promise<SupportCategory[]> {
  const query = activeOnly ? "?active_only=true" : "";
  return apiClient<SupportCategory[]>(`${SUPPORT_CATEGORIES_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function createSupportCategory(
  token: string,
  input: CreateSupportCategoryInput,
): Promise<SupportCategory> {
  return apiClient<SupportCategory>(SUPPORT_CATEGORIES_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateSupportCategory(
  token: string,
  categoryId: string,
  input: UpdateSupportCategoryInput,
): Promise<SupportCategory> {
  return apiClient<SupportCategory>(`${SUPPORT_CATEGORIES_BASE}/${categoryId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteSupportCategory(
  token: string,
  categoryId: string,
): Promise<void> {
  return apiClient<void>(`${SUPPORT_CATEGORIES_BASE}/${categoryId}`, {
    method: "DELETE",
    token,
  });
}
