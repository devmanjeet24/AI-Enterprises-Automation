import { apiClient, apiUpload } from "@/lib/api/client";
import type {
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentStatus,
  KnowledgeDocument,
  UploadDocumentInput,
} from "@/lib/knowledge-base/types";

const DOCUMENTS_BASE = "/api/v1/documents";

export function listDocuments(
  token: string,
  status?: DocumentStatus,
): Promise<KnowledgeDocument[]> {
  const query = status ? `?status=${status}` : "";
  return apiClient<KnowledgeDocument[]>(`${DOCUMENTS_BASE}${query}`, {
    method: "GET",
    token,
  });
}

export function getDocument(
  token: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiClient<KnowledgeDocument>(`${DOCUMENTS_BASE}/${documentId}`, {
    method: "GET",
    token,
  });
}

export function uploadDocument(
  token: string,
  input: UploadDocumentInput,
): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.title?.trim()) {
    formData.append("title", input.title.trim());
  }
  if (input.document_type?.trim()) {
    formData.append("document_type", input.document_type.trim());
  }
  return apiUpload<KnowledgeDocument>(DOCUMENTS_BASE, formData, { token });
}

export function processDocument(
  token: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiClient<KnowledgeDocument>(
    `${DOCUMENTS_BASE}/${documentId}/process`,
    { method: "POST", token },
  );
}

export function chunkDocument(
  token: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiClient<KnowledgeDocument>(
    `${DOCUMENTS_BASE}/${documentId}/chunk`,
    { method: "POST", token },
  );
}

export function embedDocument(
  token: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiClient<KnowledgeDocument>(
    `${DOCUMENTS_BASE}/${documentId}/embed`,
    { method: "POST", token },
  );
}

export function deleteDocument(
  token: string,
  documentId: string,
): Promise<void> {
  return apiClient<void>(`${DOCUMENTS_BASE}/${documentId}`, {
    method: "DELETE",
    token,
  });
}

export function searchDocuments(
  token: string,
  payload: DocumentSearchRequest,
): Promise<DocumentSearchResponse> {
  return apiClient<DocumentSearchResponse>(`${DOCUMENTS_BASE}/search`, {
    method: "POST",
    token,
    body: payload,
  });
}
