import { apiClient } from "@/lib/api/client";
import type {
  CreateSupportMessageInput,
  CreateSupportTicketInput,
  ListSupportTicketsParams,
  SupportAnalytics,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  UpdateSupportTicketInput,
} from "@/lib/customer-support/types";

const SUPPORT_TICKETS_BASE = "/api/v1/support-tickets";

export function getSupportAnalytics(token: string): Promise<SupportAnalytics> {
  return apiClient<SupportAnalytics>(`${SUPPORT_TICKETS_BASE}/analytics`, {
    method: "GET",
    token,
  });
}

export function listSupportTickets(
  token: string,
  params?: ListSupportTicketsParams,
): Promise<SupportTicket[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category_id) searchParams.set("category_id", params.category_id);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.assigned_user_id) {
    searchParams.set("assigned_user_id", params.assigned_user_id);
  }
  if (params?.assigned_ai_employee_id) {
    searchParams.set("assigned_ai_employee_id", params.assigned_ai_employee_id);
  }
  if (params?.unassigned_only) searchParams.set("unassigned_only", "true");
  const query = searchParams.toString();
  return apiClient<SupportTicket[]>(
    `${SUPPORT_TICKETS_BASE}${query ? `?${query}` : ""}`,
    { method: "GET", token },
  );
}

export function getSupportTicket(
  token: string,
  ticketId: string,
): Promise<SupportTicketDetail> {
  return apiClient<SupportTicketDetail>(`${SUPPORT_TICKETS_BASE}/${ticketId}`, {
    method: "GET",
    token,
  });
}

export function createSupportTicket(
  token: string,
  input: CreateSupportTicketInput,
): Promise<SupportTicket> {
  return apiClient<SupportTicket>(SUPPORT_TICKETS_BASE, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateSupportTicket(
  token: string,
  ticketId: string,
  input: UpdateSupportTicketInput,
): Promise<SupportTicket> {
  return apiClient<SupportTicket>(`${SUPPORT_TICKETS_BASE}/${ticketId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteSupportTicket(
  token: string,
  ticketId: string,
): Promise<void> {
  return apiClient<void>(`${SUPPORT_TICKETS_BASE}/${ticketId}`, {
    method: "DELETE",
    token,
  });
}

export function listTicketMessages(
  token: string,
  ticketId: string,
  includeInternal = true,
): Promise<SupportMessage[]> {
  const query = includeInternal ? "" : "?include_internal=false";
  return apiClient<SupportMessage[]>(
    `${SUPPORT_TICKETS_BASE}/${ticketId}/messages${query}`,
    { method: "GET", token },
  );
}

export function createTicketMessage(
  token: string,
  ticketId: string,
  input: CreateSupportMessageInput,
): Promise<SupportMessage> {
  return apiClient<SupportMessage>(
    `${SUPPORT_TICKETS_BASE}/${ticketId}/messages`,
    {
      method: "POST",
      token,
      body: input,
    },
  );
}

export type { ListSupportTicketsParams };
