"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/research-hub";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

const statusLabels: Record<KnowledgeDocument["status"], string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const statusAccents = {
  pending: dashboardAccents.gold,
  processing: dashboardAccents.blue,
  ready: dashboardAccents.emerald,
  failed: dashboardAccents.neutral,
} as const;

interface AnalyticsRecentDocumentsTableProps {
  documents: KnowledgeDocument[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnalyticsRecentDocumentsTable({
  documents,
  isLoading = false,
  emptyMessage = "Recent uploads will appear here.",
}: AnalyticsRecentDocumentsTableProps) {
  return (
    <DashboardCard variant="panel" accent="purple" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Recent uploads"
        subtitle="Latest documents added to the corpus"
        accent="purple"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3].map((index) => (
                <tr key={index} className="border-b border-white/[0.04]">
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <FileText className="mx-auto size-6 text-tertiary" />
                  <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              documents.map((document) => {
                const accent = statusAccents[document.status];

                return (
                  <tr
                    key={document.id}
                    className="border-b border-white/[0.04] last:border-b-0"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/knowledge-base/${document.id}`}
                        className="font-medium text-foreground transition-colors hover:text-brand"
                      >
                        {document.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-tertiary">
                        {document.chunk_count} chunks
                        {document.page_count != null
                          ? ` · ${document.page_count} pages`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          accent.border,
                          accent.bgSubtle,
                          accent.text,
                        )}
                      >
                        {statusLabels[document.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                      {formatFileSize(document.file_size_bytes)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatDateTime(document.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
