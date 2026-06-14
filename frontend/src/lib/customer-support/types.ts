export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportMessageRole = "customer" | "agent" | "ai_assistant" | "system";

export interface SupportCategory {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  organization_id: string;
  category_id: string | null;
  created_by_id: string | null;
  assigned_user_id: string | null;
  assigned_ai_employee_id: string | null;
  subject: string;
  slug: string;
  description: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  category_name: string | null;
  assigned_user_name: string | null;
  assigned_ai_employee_name: string | null;
  message_count: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_ai_employee_id: string | null;
  role: SupportMessageRole;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  author_user_name: string | null;
  author_ai_employee_name: string | null;
}

export interface SupportAnalytics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  tickets_by_status: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  tickets_by_category: Record<string, number>;
  total_messages: number;
  recent_tickets_7d: number;
  unassigned_tickets: number;
}

export interface CreateSupportCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
}

export interface UpdateSupportCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  is_active?: boolean;
}

export interface CreateSupportTicketInput {
  subject: string;
  slug?: string;
  description?: string;
  category_id?: string;
  customer_name?: string;
  customer_email?: string;
  priority?: SupportTicketPriority;
  assigned_user_id?: string;
  assigned_ai_employee_id?: string;
  initial_message?: string;
}

export interface UpdateSupportTicketInput {
  subject?: string;
  slug?: string;
  description?: string | null;
  category_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assigned_user_id?: string | null;
  assigned_ai_employee_id?: string | null;
}

export interface CreateSupportMessageInput {
  content: string;
  role?: SupportMessageRole;
  is_internal?: boolean;
}

export interface ListSupportTicketsParams {
  status?: SupportTicketStatus;
  category_id?: string;
  priority?: SupportTicketPriority;
  assigned_user_id?: string;
  assigned_ai_employee_id?: string;
  unassigned_only?: boolean;
}
