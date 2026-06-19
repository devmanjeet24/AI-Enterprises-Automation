"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthToken, useAuthUser, useUserPermissions } from "@/hooks/use-auth-token";
import {
  useBulkArchiveOmnichannelConversations,
  useBulkDeleteOmnichannelConversations,
  useDeleteOmnichannelConversation,
  useInbox,
} from "@/hooks/use-omnichannel";
import {
  updateOmnichannelConversation,
} from "@/lib/api/omnichannel-conversations";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  canDeleteOmnichannelConversations,
  hasPermission,
  PERMISSIONS,
} from "@/lib/auth/permissions";
import { omnichannelKeys } from "@/lib/omnichannel/query-keys";
import type {
  ListInboxParams,
  OmnichannelChannelType,
  OmnichannelConversationStatus,
  OmnichannelInboxItem,
  OmnichannelInboxView,
} from "@/lib/omnichannel/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/providers/toast-provider";

import { OmnichannelConfirmDialog } from "./omnichannel-confirm-dialog";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelInboxList } from "./omnichannel-inbox-list";
import { OmnichannelInboxSkeleton } from "./omnichannel-skeleton";

type StatusFilter = OmnichannelConversationStatus | "all";

type ConfirmAction =
  | { type: "delete"; ids: string[]; label: string }
  | { type: "archive"; ids: string[]; label: string };

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "ai_handling", label: "AI Handling" },
  { value: "waiting_human", label: "Waiting Human" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function OmnichannelInboxPanel({
  channelId,
  channelTypeFilter,
  emptyMessage = "No conversations in the inbox.",
}: {
  channelId?: string;
  channelTypeFilter?: OmnichannelChannelType;
  emptyMessage?: string;
}) {
  const toast = useToast();
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const permissions = useUserPermissions();
  const user = useAuthUser();
  const canWrite = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_WRITE);
  const canDelete = canDeleteOmnichannelConversations(permissions, user?.roles);

  const [inboxView, setInboxView] = useState<OmnichannelInboxView>("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const inboxParams = useMemo<ListInboxParams>(
    () => ({
      channel_id: channelId,
      channel_type: channelTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      unassigned_only: unassignedOnly,
      inbox_view: inboxView,
    }),
    [channelId, channelTypeFilter, statusFilter, unassignedOnly, inboxView],
  );

  const { data: inbox = [], isLoading, isError, error, refetch } = useInbox(inboxParams);
  const deleteMutation = useDeleteOmnichannelConversation();
  const bulkArchiveMutation = useBulkArchiveOmnichannelConversations();
  const bulkDeleteMutation = useBulkDeleteOmnichannelConversations();

  const showSelection = canWrite || canDelete;
  const isBusy =
    actionLoading ||
    deleteMutation.isPending ||
    bulkArchiveMutation.isPending ||
    bulkDeleteMutation.isPending;

  const invalidateInbox = async () => {
    await queryClient.invalidateQueries({ queryKey: omnichannelKeys.all });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (inbox.every((item) => prev.has(item.id))) return new Set();
      return new Set(inbox.map((item) => item.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const setArchiveState = async (
    conversationId: string,
    isArchived: boolean,
  ): Promise<boolean> => {
    if (!token) return false;
    setActionLoading(true);
    try {
      await updateOmnichannelConversation(token, conversationId, { is_archived: isArchived });
      await invalidateInbox();
      toast.success(isArchived ? "Conversation archived." : "Conversation restored.");
      clearSelection();
      return true;
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          isArchived ? "Failed to archive conversation." : "Failed to restore conversation.",
        ),
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = (item: OmnichannelInboxItem) => {
    setConfirmAction({ type: "archive", ids: [item.id], label: item.subject });
  };

  const handleUnarchive = (item: OmnichannelInboxItem) => {
    void setArchiveState(item.id, false);
  };

  const handleDelete = (item: OmnichannelInboxItem) => {
    setConfirmAction({ type: "delete", ids: [item.id], label: item.subject });
  };

  const handleBulkArchive = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirmAction({
      type: "archive",
      ids,
      label: `${ids.length} conversation${ids.length === 1 ? "" : "s"}`,
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirmAction({
      type: "delete",
      ids,
      label: `${ids.length} conversation${ids.length === 1 ? "" : "s"}`,
    });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      let success = true;
      if (confirmAction.type === "archive") {
        if (confirmAction.ids.length === 1) {
          success = await setArchiveState(confirmAction.ids[0], true);
        } else {
          await bulkArchiveMutation.mutateAsync(confirmAction.ids);
          toast.success(`Archived ${confirmAction.ids.length} conversations.`);
          clearSelection();
        }
      } else if (confirmAction.ids.length === 1) {
        await deleteMutation.mutateAsync(confirmAction.ids[0]);
        toast.success("Conversation deleted.");
        clearSelection();
      } else {
        const result = await bulkDeleteMutation.mutateAsync(confirmAction.ids);
        toast.success(`Deleted ${result.affected_count} conversations.`);
        clearSelection();
      }
      if (success) setConfirmAction(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed."));
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["active", "archived"] as OmnichannelInboxView[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setInboxView(value);
              clearSelection();
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
              inboxView === value
                ? "border-purple-400/40 bg-purple-400/10 text-purple-300"
                : "border-white/[0.08] text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "active" ? "Active" : "Archived"}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px]"
        >
          {statusFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
          />
          Unassigned only
        </label>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/5 px-3 py-2">
          <span className="text-[12px] text-purple-200">
            {selectedIds.size} selected
          </span>
          {canWrite && inboxView === "active" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-[12px]"
              disabled={isBusy}
              onClick={handleBulkArchive}
            >
              <Archive className="mr-1.5 size-3.5" />
              Archive selected
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-[12px] text-red-400 hover:text-red-300"
              disabled={isBusy}
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Delete selected
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-[12px]"
            disabled={isBusy}
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <OmnichannelInboxSkeleton />
      ) : isError ? (
        <OmnichannelError
          title="Failed to load inbox"
          message={getApiErrorMessage(error, "Could not load inbox.")}
          onRetry={() => void refetch()}
        />
      ) : (
        <OmnichannelInboxList
          items={inbox}
          emptyMessage={emptyMessage}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          showSelection={showSelection}
          inboxView={inboxView}
          canWrite={canWrite}
          canDelete={canDelete}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      )}

      <OmnichannelConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "delete"
            ? "Delete conversation?"
            : "Archive conversation?"
        }
        description={
          confirmAction?.type === "delete"
            ? `Delete "${confirmAction.label}"? The conversation will be hidden from the inbox but kept in the audit trail.`
            : `Archive "${confirmAction?.label ?? ""}"? It will be hidden from the active inbox but history is preserved.`
        }
        confirmLabel={confirmAction?.type === "delete" ? "Delete" : "Archive"}
        destructive={confirmAction?.type === "delete"}
        loading={isBusy}
        onCancel={() => {
          if (!isBusy) setConfirmAction(null);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
