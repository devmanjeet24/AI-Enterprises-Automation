"use client";

import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/use-knowledge-base";
import { getApiErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { DocumentDetailActions } from "./document-detail-actions";
import { DocumentDetailMetadata } from "./document-detail-metadata";
import { DocumentDetailSkeleton } from "./document-list-skeleton";
import { DocumentPipelineSteps } from "./document-pipeline-steps";
import { DocumentStatusBadge } from "./document-status-badge";
import { KnowledgeBaseError } from "./knowledge-base-error";

interface KnowledgeBaseDetailPageProps {
  documentId: string;
}

export function KnowledgeBaseDetailPage({
  documentId,
}: KnowledgeBaseDetailPageProps) {
  const accent = dashboardAccents.purple;
  const { data: document, isLoading, isError, error, refetch } = useDocument(documentId);

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <DocumentDetailSkeleton />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="px-6 py-8 md:px-8">
        <KnowledgeBaseError
          title="Failed to load document"
          message={getApiErrorMessage(error, "Could not load this document.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!document) {
    notFound();
  }

  return (
    <div className="pb-10 md:pb-12">
      <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
        <Link href="/knowledge-base">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            Back to Knowledge Base
          </Button>
        </Link>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <FileText className={cn("size-5", accent.text)} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Document detail
              </p>
              <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
                {document.title}
              </h1>
              <p className="mt-1 truncate text-[14px] text-muted-foreground">
                {document.original_filename}
              </p>
              <div className="mt-3">
                <DocumentStatusBadge status={document.status} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <DocumentPipelineSteps document={document} />

        <div className="grid gap-6 lg:grid-cols-2">
          <DocumentDetailMetadata document={document} />
          <DocumentDetailActions document={document} />
        </div>
      </div>
    </div>
  );
}
