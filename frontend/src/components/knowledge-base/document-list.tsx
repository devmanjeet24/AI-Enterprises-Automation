"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/dashboard/dashboard-card";
import { formatDate, formatFileSize } from "@/config/knowledge-base";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DocumentStatusBadge } from "./document-status-badge";

interface DocumentListProps {
  documents: KnowledgeDocument[];
  statusFilter?: DocumentStatus | "all";
  onStatusFilterChange?: (status: DocumentStatus | "all") => void;
}

const statusFilters: { value: DocumentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

export function DocumentList({
  documents,
  statusFilter = "all",
  onStatusFilterChange,
}: DocumentListProps) {
  const accent = dashboardAccents.purple;

  const filtered =
    statusFilter === "all"
      ? documents
      : documents.filter((doc) => doc.status === statusFilter);

  return (
    <DashboardCard variant="list" accent="purple" interactive={false} className="flex flex-col">
      <DashboardCardHeader
        title="Documents"
        subtitle={`${filtered.length} document${filtered.length === 1 ? "" : "s"}`}
        accent="purple"
      />

      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-5 py-3">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onStatusFilterChange?.(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
              statusFilter === filter.value
                ? cn(accent.bgSubtle, accent.border, accent.text)
                : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Pages</th>
              <th className="hidden px-5 py-3 font-medium lg:table-cell">Chunks</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-[14px] text-muted-foreground"
                >
                  No documents match this filter.
                </td>
              </tr>
            )}
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                className="group transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/knowledge-base/${doc.id}`}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                        accent.bgSubtle,
                        accent.border,
                      )}
                    >
                      <FileText className={cn("size-4", accent.text)} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-foreground group-hover:text-brand">
                        {doc.title}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {doc.original_filename} · {formatFileSize(doc.file_size_bytes)}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <DocumentStatusBadge status={doc.status} />
                </td>
                <td className="hidden px-5 py-3.5 text-[13px] text-muted-foreground md:table-cell">
                  {doc.page_count ?? "—"}
                </td>
                <td className="hidden px-5 py-3.5 text-[13px] text-muted-foreground lg:table-cell">
                  {doc.chunk_count > 0 ? doc.chunk_count : "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-muted-foreground">
                  {formatDate(doc.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
