import type { DashboardOverview } from "@/lib/dashboard/types";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";

import {
  average,
  countInLastDays,
  countWhere,
  durationHours,
  formatBytes,
  percentOf,
} from "./utils";

export interface KnowledgeAnalyticsMetrics {
  totalDocuments: number;
  readyDocuments: number;
  pendingDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  inPipelineDocuments: number;
  ingestionSuccessRate: number;
  embeddedDocuments: number;
  embeddedCoveragePercent: number;
  totalPages: number;
  totalChunks: number;
  totalStorageBytes: number;
  totalStorageLabel: string;
  avgChunksPerReadyDoc: number | null;
  avgFileSizeBytes: number | null;
  avgFileSizeLabel: string;
  avgTimeToReadyHours: number | null;
  documentsByStatus: Record<string, number>;
  documentsByType: Record<string, number>;
  storageByStatus: Record<string, number>;
  chunkBuckets: Record<string, number>;
  uploadsLast7Days: number;
  uploadsLast30Days: number;
  recentDocuments: KnowledgeDocument[];
  insights: string[];
}

function buildInsights(metrics: Omit<KnowledgeAnalyticsMetrics, "insights">): string[] {
  const insights: string[] = [];

  if (metrics.totalDocuments === 0) {
    return ["Upload documents to the knowledge base to start tracking corpus metrics."];
  }

  insights.push(
    `${metrics.readyDocuments} of ${metrics.totalDocuments} documents are ready (${percentOf(metrics.readyDocuments, metrics.totalDocuments)}% of corpus).`,
  );

  if (metrics.inPipelineDocuments > 0) {
    insights.push(
      `${metrics.inPipelineDocuments} document${metrics.inPipelineDocuments === 1 ? "" : "s"} currently in the ingestion pipeline.`,
    );
  }

  if (metrics.failedDocuments > 0) {
    insights.push(
      `${metrics.failedDocuments} failed document${metrics.failedDocuments === 1 ? "" : "s"} may need reprocessing.`,
    );
  } else if (metrics.readyDocuments > 0) {
    insights.push(
      `Ingestion success rate is ${metrics.ingestionSuccessRate}% among processed documents.`,
    );
  }

  if (metrics.uploadsLast7Days > 0) {
    insights.push(
      `${metrics.uploadsLast7Days} upload${metrics.uploadsLast7Days === 1 ? "" : "s"} in the last 7 days.`,
    );
  }

  if (metrics.embeddedCoveragePercent < 100 && metrics.readyDocuments > 0) {
    insights.push(
      `${metrics.embeddedCoveragePercent}% of ready documents have completed embedding.`,
    );
  }

  return insights.slice(0, 4);
}

function chunkBucketLabel(count: number): string {
  if (count === 0) return "0 chunks";
  if (count <= 10) return "1–10 chunks";
  if (count <= 50) return "11–50 chunks";
  return "51+ chunks";
}

export function computeKnowledgeMetrics(
  documents: KnowledgeDocument[],
  overview?: DashboardOverview | null,
): KnowledgeAnalyticsMetrics {
  const totalDocuments = documents.length || overview?.total_documents || 0;

  const readyDocuments = countWhere(documents, (doc) => doc.status === "ready");
  const pendingDocuments = countWhere(documents, (doc) => doc.status === "pending");
  const processingDocuments = countWhere(
    documents,
    (doc) => doc.status === "processing",
  );
  const failedDocuments = countWhere(documents, (doc) => doc.status === "failed");
  const inPipelineDocuments = pendingDocuments + processingDocuments;

  const processedCount = readyDocuments + failedDocuments;
  const ingestionSuccessRate = percentOf(readyDocuments, processedCount);

  const embeddedDocuments = countWhere(
    documents,
    (doc) => doc.status === "ready" && doc.embedded_at != null,
  );
  const embeddedCoveragePercent = percentOf(embeddedDocuments, readyDocuments);

  const totalPages = documents.reduce(
    (sum, doc) => sum + (doc.page_count ?? 0),
    0,
  );
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const totalStorageBytes = documents.reduce(
    (sum, doc) => sum + doc.file_size_bytes,
    0,
  );

  const readyChunkCounts = documents
    .filter((doc) => doc.status === "ready")
    .map((doc) => doc.chunk_count);
  const avgChunksPerReadyDoc = average(readyChunkCounts);

  const fileSizes = documents.map((doc) => doc.file_size_bytes);
  const avgFileSizeBytes = average(fileSizes);

  const readyDurations = documents
    .filter((doc) => doc.status === "ready" && doc.embedded_at)
    .map((doc) => durationHours(doc.created_at, doc.embedded_at))
    .filter((value): value is number => value != null);
  const avgTimeToReadyHours = average(readyDurations);

  const documentsByStatus: Record<string, number> = {
    pending: pendingDocuments,
    processing: processingDocuments,
    ready: readyDocuments,
    failed: failedDocuments,
  };

  const documentsByType: Record<string, number> = {};
  for (const doc of documents) {
    const type = doc.document_type?.trim() || "Unspecified";
    documentsByType[type] = (documentsByType[type] ?? 0) + 1;
  }

  const storageByStatus: Record<string, number> = {};
  for (const doc of documents) {
    storageByStatus[doc.status] =
      (storageByStatus[doc.status] ?? 0) + doc.file_size_bytes;
  }

  const chunkBuckets: Record<string, number> = {
    "0 chunks": 0,
    "1–10 chunks": 0,
    "11–50 chunks": 0,
    "51+ chunks": 0,
  };
  for (const doc of documents) {
    const label = chunkBucketLabel(doc.chunk_count);
    chunkBuckets[label] = (chunkBuckets[label] ?? 0) + 1;
  }

  const recentDocuments = [...documents]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 8);

  const baseMetrics = {
    totalDocuments,
    readyDocuments,
    pendingDocuments,
    processingDocuments,
    failedDocuments,
    inPipelineDocuments,
    ingestionSuccessRate,
    embeddedDocuments,
    embeddedCoveragePercent,
    totalPages,
    totalChunks,
    totalStorageBytes,
    totalStorageLabel: formatBytes(totalStorageBytes),
    avgChunksPerReadyDoc,
    avgFileSizeBytes,
    avgFileSizeLabel: avgFileSizeBytes != null ? formatBytes(avgFileSizeBytes) : "—",
    avgTimeToReadyHours,
    documentsByStatus,
    documentsByType,
    storageByStatus,
    chunkBuckets,
    uploadsLast7Days: countInLastDays(documents, 7),
    uploadsLast30Days: countInLastDays(documents, 30),
    recentDocuments,
  };

  return {
    ...baseMetrics,
    insights: buildInsights(baseMetrics),
  };
}
