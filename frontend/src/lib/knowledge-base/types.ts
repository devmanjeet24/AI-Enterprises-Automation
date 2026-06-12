export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface KnowledgeDocument {
  id: string;
  organization_id: string;
  uploaded_by_id: string | null;
  title: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  document_type: string | null;
  status: DocumentStatus;
  page_count: number | null;
  chunk_count: number;
  error_message: string | null;
  processed_at: string | null;
  embedded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSearchRequest {
  query: string;
  top_k?: number;
}

export interface DocumentSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  page_number: number | null;
  content: string;
  similarity_score: number;
}

export interface DocumentSearchResponse {
  query: string;
  results: DocumentSearchResult[];
}

export interface KnowledgeQueryRequest {
  question: string;
}

export interface KnowledgeSourceCitation {
  document_title: string;
  page_number: number | null;
  similarity_score: number;
}

export interface KnowledgeQueryResponse {
  answer: string;
  sources: KnowledgeSourceCitation[];
}

export interface UploadDocumentInput {
  file: File;
  title?: string;
  document_type?: string;
}
