import { apiClient } from "@/lib/api/client";
import type { EmployeeConversationDetail } from "@/lib/ai-employees/types";

const CONVERSATIONS_BASE = "/api/v1/conversations";

export function getConversation(
  token: string,
  conversationId: string,
): Promise<EmployeeConversationDetail> {
  return apiClient<EmployeeConversationDetail>(
    `${CONVERSATIONS_BASE}/${conversationId}`,
    { method: "GET", token },
  );
}
