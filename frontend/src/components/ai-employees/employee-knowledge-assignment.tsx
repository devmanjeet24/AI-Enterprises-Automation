"use client";

import { BookOpen, Check, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useAssignableDocuments,
  useReplaceEmployeeKnowledge,
} from "@/hooks/use-ai-employees";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AIEmployeeDetail } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

interface EmployeeKnowledgeAssignmentProps {
  employee: AIEmployeeDetail;
  canEdit?: boolean;
}

export function EmployeeKnowledgeAssignment({
  employee,
  canEdit = true,
}: EmployeeKnowledgeAssignmentProps) {
  const accent = dashboardAccents.emerald;
  const toast = useToast();
  const replaceMutation = useReplaceEmployeeKnowledge(employee.id);
  const {
    data: assignableDocuments = [],
    isLoading,
    isError,
    error,
  } = useAssignableDocuments();

  const initialIds = new Set(
    employee.document_assignments.map((a) => a.knowledge_document_id),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialIds);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedIds(
      new Set(employee.document_assignments.map((a) => a.knowledge_document_id)),
    );
    setHasChanges(false);
  }, [employee.document_assignments]);

  const toggleDocument = (id: string) => {
    if (!canEdit) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await replaceMutation.mutateAsync([...selectedIds]);
      toast.success("Knowledge assignments saved.");
      setHasChanges(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save knowledge assignments."));
    }
  };

  return (
    <DashboardCard variant="panel" accent="emerald" interactive={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Knowledge assignment
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Only embedded, ready documents can be assigned. Chat requires at least one
            document.
          </p>
        </div>
        {canEdit && (
          <Button
            variant="brand"
            size="sm"
            disabled={!hasChanges || replaceMutation.isPending}
            onClick={handleSave}
          >
            {replaceMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-[14px] text-destructive">
            {getApiErrorMessage(error, "Failed to load assignable documents.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <ul className="mt-5 space-y-2">
          {assignableDocuments.map((doc) => {
            const isSelected = selectedIds.has(doc.id);
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  disabled={!canEdit || replaceMutation.isPending}
                  onClick={() => toggleDocument(doc.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? cn(accent.bgSubtle, accent.border)
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]",
                    !canEdit && "cursor-default opacity-80",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border",
                      isSelected
                        ? cn(accent.border, accent.bg)
                        : "border-white/[0.12] bg-white/[0.02]",
                    )}
                  >
                    {isSelected && <Check className={cn("size-3", accent.text)} />}
                  </div>
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      accent.bgSubtle,
                      accent.border,
                    )}
                  >
                    <BookOpen className={cn("size-4", accent.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-foreground">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {doc.document_type ?? "Document"}
                      {doc.page_count != null && ` · ${doc.page_count} pages`}
                      {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && !isError && assignableDocuments.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-white/[0.08] px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            No embedded documents available.{" "}
            <Link href="/knowledge-base" className="text-brand hover:text-brand-hover">
              Upload and embed documents
            </Link>{" "}
            in the Knowledge Base first.
          </p>
        </div>
      )}

      {!isLoading && !isError && assignableDocuments.length > 0 && (
        <p className="mt-4 text-[12px] text-tertiary">
          {selectedIds.size} document{selectedIds.size === 1 ? "" : "s"} selected
        </p>
      )}
    </DashboardCard>
  );
}
