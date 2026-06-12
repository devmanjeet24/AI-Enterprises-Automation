"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDate, formatFileSize } from "@/config/knowledge-base";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";

import { DocumentStatusBadge } from "./document-status-badge";

interface DocumentDetailMetadataProps {
  document: KnowledgeDocument;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function DocumentDetailMetadata({ document }: DocumentDetailMetadataProps) {
  return (
    <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Metadata
      </p>

      <dl className="mt-4 divide-y divide-white/[0.05]">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-[13px] text-muted-foreground">Status</dt>
          <dd>
            <DocumentStatusBadge status={document.status} />
          </dd>
        </div>
        <MetadataRow label="Original file" value={document.original_filename} />
        <MetadataRow label="File size" value={formatFileSize(document.file_size_bytes)} />
        <MetadataRow label="MIME type" value={document.mime_type} />
        <MetadataRow
          label="Document type"
          value={document.document_type ?? "—"}
        />
        <MetadataRow
          label="Pages"
          value={document.page_count != null ? String(document.page_count) : "—"}
        />
        <MetadataRow
          label="Chunks"
          value={document.chunk_count > 0 ? String(document.chunk_count) : "—"}
        />
        <MetadataRow
          label="Processed at"
          value={document.processed_at ? formatDate(document.processed_at) : "—"}
        />
        <MetadataRow
          label="Embedded at"
          value={document.embedded_at ? formatDate(document.embedded_at) : "—"}
        />
        <MetadataRow label="Created" value={formatDate(document.created_at)} />
        <MetadataRow label="Last updated" value={formatDate(document.updated_at)} />
      </dl>
    </DashboardCard>
  );
}
