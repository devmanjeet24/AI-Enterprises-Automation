import type { KnowledgeSourceCitation } from "@/lib/knowledge-base/types";

export type AIEmployeeStatus = "active" | "inactive";

export interface AIEmployee {
  id: string;
  organization_id: string;
  created_by_id: string | null;
  name: string;
  role: string;
  description: string | null;
  system_prompt: string;
  status: AIEmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface AIEmployeeDocumentAssignment {
  ai_employee_id: string;
  knowledge_document_id: string;
  assigned_at: string;
}

export interface AIEmployeeToolAssignment {
  id: string;
  ai_employee_id: string;
  tool_slug: string;
  is_enabled: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AIEmployeeDetail extends AIEmployee {
  document_assignments: AIEmployeeDocumentAssignment[];
  tools: AIEmployeeToolAssignment[];
}

export interface CreateEmployeeInput {
  name: string;
  role: string;
  description?: string;
  system_prompt: string;
  status?: AIEmployeeStatus;
}

export interface UpdateEmployeeInput {
  name?: string;
  role?: string;
  description?: string | null;
  system_prompt?: string;
  status?: AIEmployeeStatus;
}

export interface ToolAssignmentInput {
  tool_slug: string;
  is_enabled?: boolean;
  config?: Record<string, unknown> | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  employee_id: string;
  employee_name: string;
  answer: string;
  sources: KnowledgeSourceCitation[];
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: KnowledgeSourceCitation[] | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeConversation {
  id: string;
  organization_id: string;
  ai_employee_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeConversationDetail extends EmployeeConversation {
  messages: ChatMessage[];
}

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
}
