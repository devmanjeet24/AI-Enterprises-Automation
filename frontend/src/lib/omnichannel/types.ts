export type OmnichannelChannelType =
  | "website_chat"
  | "telegram"
  | "slack"
  | "email"
  | "whatsapp"
  | "linkedin"
  | "internal";

export type OmnichannelInboxView = "active" | "archived";

export type OmnichannelConversationStatus =
  | "open"
  | "ai_handling"
  | "waiting_human"
  | "resolved"
  | "closed";

export type OmnichannelHandoffStatus =
  | "none"
  | "requested"
  | "assigned"
  | "completed";

export type OmnichannelMessageRole =
  | "customer"
  | "agent"
  | "ai_assistant"
  | "system";

export interface OmnichannelChannel {
  id: string;
  organization_id: string;
  ai_employee_id: string | null;
  created_by_id: string | null;
  name: string;
  slug: string;
  channel_type: OmnichannelChannelType;
  description: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  public_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface OmnichannelChannelDetail extends OmnichannelChannel {
  ai_employee_name: string | null;
  conversation_count: number;
}

export interface OmnichannelConversation {
  id: string;
  organization_id: string;
  channel_id: string;
  created_by_id: string | null;
  assigned_user_id: string | null;
  assigned_ai_employee_id: string | null;
  subject: string;
  slug: string;
  external_contact_name: string | null;
  external_contact_id: string | null;
  status: OmnichannelConversationStatus;
  handoff_status: OmnichannelHandoffStatus;
  shared_context: Record<string, unknown> | null;
  last_message_at: string | null;
  support_ticket_id: string | null;
  resolved_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OmnichannelInboxItem extends OmnichannelConversation {
  channel_name: string | null;
  channel_type: OmnichannelChannelType | string | null;
  message_count: number;
  last_message_preview: string | null;
}

export interface OmnichannelMessage {
  id: string;
  conversation_id: string;
  author_user_id: string | null;
  author_ai_employee_id: string | null;
  role: OmnichannelMessageRole;
  content: string;
  is_internal: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  author_user_name: string | null;
  author_ai_employee_name: string | null;
}

export interface OmnichannelConversationDetail extends OmnichannelConversation {
  channel_name: string | null;
  channel_type: OmnichannelChannelType | string | null;
  assigned_user_name: string | null;
  assigned_ai_employee_name: string | null;
  message_count: number;
  has_resolution: boolean;
  messages: OmnichannelMessage[];
}

export interface OmnichannelAnalytics {
  total_channels: number;
  active_channels: number;
  total_conversations: number;
  open_conversations: number;
  waiting_human_conversations: number;
  resolved_conversations: number;
  total_messages: number;
  recent_conversations_7d: number;
  pending_handoffs: number;
  handoffs_by_status: Record<string, number>;
  ai_handled_conversations: number;
  human_handled_conversations: number;
  conversations_by_status: Record<string, number>;
  conversations_by_channel_type: Record<string, number>;
  messages_by_role: Record<string, number>;
  conversations_by_channel: Record<string, number>;
}

export interface OmnichannelAiSuggestion {
  suggestion: string;
  sources: Record<string, unknown>[];
}

export interface CreateOmnichannelChannelInput {
  name: string;
  slug?: string;
  description?: string;
  channel_type: OmnichannelChannelType;
  ai_employee_id?: string;
  config?: Record<string, unknown>;
}

export interface UpdateOmnichannelChannelInput {
  name?: string;
  slug?: string;
  description?: string | null;
  channel_type?: OmnichannelChannelType;
  ai_employee_id?: string | null;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface CreateOmnichannelConversationInput {
  channel_id: string;
  subject: string;
  slug?: string;
  external_contact_name?: string;
  external_contact_id?: string;
  assigned_user_id?: string;
  assigned_ai_employee_id?: string;
  shared_context?: Record<string, unknown>;
  initial_message?: string;
}

export interface UpdateOmnichannelConversationInput {
  subject?: string;
  slug?: string;
  external_contact_name?: string | null;
  external_contact_id?: string | null;
  status?: OmnichannelConversationStatus;
  handoff_status?: OmnichannelHandoffStatus;
  assigned_user_id?: string | null;
  assigned_ai_employee_id?: string | null;
  shared_context?: Record<string, unknown> | null;
  is_archived?: boolean;
}

export interface OmnichannelBulkActionResult {
  affected_count: number;
  conversation_ids: string[];
}

export interface ListInboxParams {
  channel_id?: string;
  channel_type?: OmnichannelChannelType;
  status?: OmnichannelConversationStatus;
  unassigned_only?: boolean;
  inbox_view?: OmnichannelInboxView;
}

export interface CreateOmnichannelMessageInput {
  content: string;
  role?: OmnichannelMessageRole;
  is_internal?: boolean;
}
