"use client";

import { Cpu, FileSearch, Layers, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  useChunkDocument,
  useDeleteDocument,
  useEmbedDocument,
  useProcessDocument,
} from "@/hooks/use-knowledge-base";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import { useToast } from "@/providers/toast-provider";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { cn } from "@/lib/utils";

interface DocumentDetailActionsProps {
  document: KnowledgeDocument;
  id?: string;
}

type PipelineAction = "process" | "chunk" | "embed" | "delete";

export function DocumentDetailActions({ document, id }: DocumentDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const permissions = useUserPermissions();
  const [activeAction, setActiveAction] = useState<PipelineAction | null>(null);

  const canWrite = hasPermission(permissions, PERMISSIONS.DOCUMENTS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.DOCUMENTS_DELETE);

  const processMutation = useProcessDocument(document.id);
  const chunkMutation = useChunkDocument(document.id);
  const embedMutation = useEmbedDocument(document.id);
  const deleteMutation = useDeleteDocument();

  const isBusy =
    activeAction !== null ||
    processMutation.isPending ||
    chunkMutation.isPending ||
    embedMutation.isPending ||
    deleteMutation.isPending;

  const canProcess = document.status === "pending" || document.status === "failed";
  const canChunk =
    document.processed_at != null &&
    document.chunk_count === 0 &&
    document.status !== "failed";
  const canEmbed =
    document.chunk_count > 0 &&
    !document.embedded_at &&
    document.status !== "failed";
  const isEmbedded = document.embedded_at != null;

  const runAction = async (
    action: PipelineAction,
    mutation: { mutateAsync: () => Promise<unknown> },
    successMessage: string,
  ) => {
    setActiveAction(action);
    try {
      await mutation.mutateAsync();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Action failed."));
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setActiveAction("delete");
    try {
      await deleteMutation.mutateAsync(document.id);
      toast.success(`"${document.title}" deleted.`);
      router.push("/knowledge-base");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete document."));
      setActiveAction(null);
    }
  };

  if (!canWrite && !canDelete) {
    return (
      <div id={id}>
        <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Pipeline actions
          </p>
          <p className="mt-3 text-[13px] text-muted-foreground">
            You do not have permission to manage documents in this organization.
          </p>
        </DashboardCard>
      </div>
    );
  }

  const needsPipeline =
    canProcess || canChunk || canEmbed || (canWrite && !isEmbedded);

  return (
    <div id={id}>
      <DashboardCard variant="panel" accent="purple" interactive={false} className="p-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Pipeline actions
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {needsPipeline
          ? "Run Process, then Chunk, then Embed in order. Upload alone does not start processing."
          : "Document pipeline is complete."}
      </p>

      {canWrite && (
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="justify-start"
            disabled={!canProcess || isBusy}
            onClick={() =>
              runAction(
                "process",
                processMutation,
                "Text extracted successfully.",
              )
            }
          >
            {activeAction === "process" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileSearch className="size-3.5" />
            )}
            Process — extract text
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="justify-start"
            disabled={!canChunk || isBusy}
            onClick={() =>
              runAction("chunk", chunkMutation, "Document chunked successfully.")
            }
          >
            {activeAction === "chunk" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Layers className="size-3.5" />
            )}
            Chunk — split into segments
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="justify-start"
            disabled={!canEmbed || isBusy}
            onClick={() =>
              runAction("embed", embedMutation, "Embeddings generated successfully.")
            }
          >
            {activeAction === "embed" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Cpu className="size-3.5" />
            )}
            Embed — generate vectors
          </Button>

          {isEmbedded && (
            <p className="mt-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-[12px] text-success">
              Document is embedded and can be assigned to AI Employees.
            </p>
          )}
        </div>
      )}

      {canDelete && (
        <div className={cn("border-t border-white/[0.06] pt-5", canWrite && "mt-6")}>
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start"
            disabled={isBusy}
            onClick={handleDelete}
          >
            {activeAction === "delete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete document
          </Button>
        </div>
      )}
      </DashboardCard>
    </div>
  );
}
