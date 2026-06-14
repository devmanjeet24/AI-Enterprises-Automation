import type {
  ListSupportTicketsParams,
  SupportTicketStatus,
} from "@/lib/customer-support/types";

export const supportTicketKeys = {
  all: ["support-tickets"] as const,
  lists: () => [...supportTicketKeys.all, "list"] as const,
  list: (params?: ListSupportTicketsParams) =>
    [...supportTicketKeys.lists(), params ?? {}] as const,
  details: () => [...supportTicketKeys.all, "detail"] as const,
  detail: (id: string) => [...supportTicketKeys.details(), id] as const,
  analytics: () => [...supportTicketKeys.all, "analytics"] as const,
  messages: (ticketId: string) =>
    [...supportTicketKeys.all, "messages", ticketId] as const,
  categories: () => ["support-categories"] as const,
  categoryList: (activeOnly?: boolean) =>
    [...supportTicketKeys.categories(), { activeOnly: activeOnly ?? false }] as const,
};

export type { SupportTicketStatus };
