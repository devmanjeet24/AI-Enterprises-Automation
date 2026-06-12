import { apiClient } from "@/lib/api/client";
import type {
  KnowledgeQueryRequest,
  KnowledgeQueryResponse,
} from "@/lib/knowledge-base/types";

const KNOWLEDGE_BASE = "/api/v1/knowledge";

export function queryKnowledge(
  token: string,
  payload: KnowledgeQueryRequest,
): Promise<KnowledgeQueryResponse> {
  return apiClient<KnowledgeQueryResponse>(`${KNOWLEDGE_BASE}/query`, {
    method: "POST",
    token,
    body: payload,
  });
}
