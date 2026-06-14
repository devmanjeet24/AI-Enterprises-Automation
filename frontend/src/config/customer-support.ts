import type {
  SupportAnalytics,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/customer-support/types";

export type {
  CreateSupportCategoryInput,
  CreateSupportMessageInput,
  CreateSupportTicketInput,
  ListSupportTicketsParams,
  SupportAnalytics,
  SupportCategory,
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
  UpdateSupportCategoryInput,
  UpdateSupportTicketInput,
} from "@/lib/customer-support/types";

export const supportStatusLabels: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

export const supportPriorityLabels: Record<SupportTicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export function getTicketInitials(subject: string): string {
  return subject
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function slugifyTicketSubject(subject: string): string {
  return subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function computeSupportStats(
  tickets: SupportTicket[],
  analytics?: SupportAnalytics | null,
) {
  if (analytics) {
    return {
      total: analytics.total_tickets,
      open: analytics.open_tickets,
      inProgress: analytics.in_progress_tickets,
      resolved: analytics.resolved_tickets,
      unassigned: analytics.unassigned_tickets,
      recentTickets: analytics.recent_tickets_7d,
      totalMessages: analytics.total_messages,
      analyticsAvailable: true as const,
    };
  }

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    unassigned: tickets.filter(
      (ticket) =>
        !ticket.assigned_user_id &&
        !ticket.assigned_ai_employee_id &&
        ticket.status !== "resolved" &&
        ticket.status !== "closed",
    ).length,
    recentTickets: null,
    totalMessages: null,
    analyticsAvailable: false as const,
  };
}

export const CATEGORY_COLORS = [
  "#6B9BF8",
  "#A78BFA",
  "#4ADE80",
  "#f5c518",
  "#F87171",
  "#FB923C",
];
