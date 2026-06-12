import type { DocumentStatus } from "@/lib/knowledge-base/types";

export type {
  DocumentStatus,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentSearchResult,
  KnowledgeDocument,
  KnowledgeQueryRequest,
  KnowledgeQueryResponse,
  KnowledgeSourceCitation,
  UploadDocumentInput,
} from "@/lib/knowledge-base/types";

export const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export const documentTypeOptions = [
  { value: "policy", label: "Policy" },
  { value: "handbook", label: "Handbook" },
  { value: "sop", label: "SOP" },
  { value: "guide", label: "Guide" },
  { value: "other", label: "Other" },
] as const;

export const pipelineSteps = [
  { key: "upload", label: "Upload", description: "PDF stored on disk" },
  { key: "process", label: "Process", description: "Text extracted from PDF" },
  { key: "chunk", label: "Chunk", description: "Split into searchable segments" },
  { key: "embed", label: "Embed", description: "Vectors stored in ChromaDB" },
] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function computeDocumentStats(
  documents: {
    status: DocumentStatus;
    chunk_count: number;
    embedded_at: string | null;
  }[],
) {
  return {
    total: documents.length,
    ready: documents.filter((doc) => doc.embedded_at != null).length,
    inPipeline: documents.filter(
      (doc) => doc.status === "pending" || doc.status === "processing",
    ).length,
    failed: documents.filter((doc) => doc.status === "failed").length,
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunk_count, 0),
  };
}
