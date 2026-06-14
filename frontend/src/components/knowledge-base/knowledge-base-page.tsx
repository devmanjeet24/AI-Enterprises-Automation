"use client";

import { useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import { isAccessDeniedError } from "@/lib/knowledge-base/access";
import type { DocumentStatus } from "@/lib/knowledge-base/types";
import { useDocuments } from "@/hooks/use-knowledge-base";
import { useUserPermissions } from "@/hooks/use-auth-token";

import { DocumentEmptyState } from "./document-empty-state";
import { DocumentList } from "./document-list";
import { DocumentListSkeleton } from "./document-list-skeleton";
import { DocumentUploadModal } from "./document-upload-modal";
import { KnowledgeBaseAccessDenied } from "./knowledge-base-access-denied";
import { KnowledgeBaseError } from "./knowledge-base-error";
import { KnowledgeBaseHero } from "./knowledge-base-hero";
import { KnowledgeBaseStats } from "./knowledge-base-stats";
import { KnowledgeQueryPanel } from "./knowledge-query-panel";
import { SemanticSearchPanel } from "./semantic-search-panel";

export function KnowledgeBasePage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const permissions = useUserPermissions();

  const canUpload = hasPermission(permissions, PERMISSIONS.DOCUMENTS_WRITE);
  const canSearch = hasPermission(permissions, PERMISSIONS.DOCUMENTS_READ);
  const canQuery = hasPermission(permissions, PERMISSIONS.KNOWLEDGE_QUERY);

  const { data: documents = [], isLoading, isError, error, refetch } =
    useDocuments("all");

  const accessDenied = isError && isAccessDeniedError(error);
  const errorMessage = isError
    ? getApiErrorMessage(error, "Failed to load documents.")
    : null;

  if (accessDenied) {
    return (
      <div className="px-6 py-16 md:px-8">
        <KnowledgeBaseAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <KnowledgeBaseHero
        documents={documents}
        canUpload={canUpload}
        onUploadClick={() => setUploadOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Inventory"
            title="Document overview"
            description="Track upload status and pipeline progress across your knowledge base."
          />
          <KnowledgeBaseStats documents={documents} isLoading={isLoading} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Library"
            title="Documents & discovery"
            description="Manage uploaded files, search embedded chunks, and ask grounded questions."
          />

          {isLoading ? (
            <DocumentListSkeleton />
          ) : isError ? (
            <KnowledgeBaseError
              title="Failed to load documents"
              message={errorMessage!}
              onRetry={() => refetch()}
            />
          ) : documents.length === 0 ? (
            <DocumentEmptyState
              canUpload={canUpload}
              onUploadClick={() => setUploadOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <DocumentList
                  documents={documents}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </div>
              <div className="flex flex-col gap-6 xl:col-span-5">
                {canSearch && <SemanticSearchPanel />}
                {canQuery && <KnowledgeQueryPanel />}
              </div>
            </div>
          )}
        </section>
      </div>

      {canUpload && (
        <DocumentUploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}
