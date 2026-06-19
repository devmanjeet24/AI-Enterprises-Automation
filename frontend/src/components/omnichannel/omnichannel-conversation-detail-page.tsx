"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, Loader2, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { channelTypeLabels } from "@/config/omnichannel";
import {
  useDeleteOmnichannelConversation,
  useOmnichannelConversation,
  useRequestHumanHandoff,
  useUpdateOmnichannelConversation,
} from "@/hooks/use-omnichannel";
import { useOmnichannelRealtime } from "@/hooks/use-omnichannel-realtime";
import { useAuthUser, useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  canDeleteOmnichannelConversations,
  hasPermission,
  PERMISSIONS,
} from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/omnichannel/access";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { OmnichannelAccessDenied } from "./omnichannel-access-denied";
import {
  OmnichannelHandoffBadge,
  OmnichannelStatusBadge,
} from "./omnichannel-badges";
import { OmnichannelConfirmDialog } from "./omnichannel-confirm-dialog";
import { OmnichannelConversationThread } from "./omnichannel-conversation-thread";
import { OmnichannelConversationSidebar } from "./omnichannel-conversation-sidebar";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelConversationDetailSkeleton } from "./omnichannel-skeleton";

export function OmnichannelConversationDetailPage({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const permissions = useUserPermissions();
  const user = useAuthUser();
  const canExecute = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_EXECUTE);
  const canWrite = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_WRITE);
  const canDelete = canDeleteOmnichannelConversations(permissions, user?.roles);
  useOmnichannelRealtime({ conversationId });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: conversation, isLoading, isError, error, refetch } =
    useOmnichannelConversation(conversationId);
  const handoffMutation = useRequestHumanHandoff(conversationId);
  const updateMutation = useUpdateOmnichannelConversation(conversationId);
  const deleteMutation = useDeleteOmnichannelConversation();

  if (isLoading) return <OmnichannelConversationDetailSkeleton />;

  if (isError && isAccessDeniedError(error)) {
    return (
      <div className="px-6 py-10 md:px-8">
        <OmnichannelAccessDenied message="You do not have permission to view this conversation." />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <div className="px-6 py-10 md:px-8">
        <OmnichannelError
          message={getApiErrorMessage(error, "Could not load conversation.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!conversation) notFound();

  const handleHandoff = async () => {
    try {
      await handoffMutation.mutateAsync();
      toast.success("Human handoff requested.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to request handoff."));
    }
  };

  const handleArchiveToggle = async () => {
    const isArchived = Boolean(conversation.archived_at);
    try {
      await updateMutation.mutateAsync({ is_archived: !isArchived });
      toast.success(isArchived ? "Conversation restored." : "Conversation archived.");
      if (!isArchived) {
        router.push("/omnichannel");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update archive state."));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(conversationId);
      toast.success("Conversation deleted.");
      router.push("/omnichannel");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete conversation."));
    }
  };

  const actionBusy =
    handoffMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link
          href={conversation.channel_id ? `/omnichannel/channels/${conversation.channel_id}` : "/omnichannel"}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold text-foreground">{conversation.subject}</h1>
              <OmnichannelStatusBadge status={conversation.status} />
              <OmnichannelHandoffBadge status={conversation.handoff_status} />
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {conversation.channel_id ? (
                <Link
                  href={`/omnichannel/channels/${conversation.channel_id}`}
                  className="font-medium transition-colors hover:text-brand"
                >
                  {conversation.channel_name ?? "Channel"}
                </Link>
              ) : (
                (conversation.channel_name ?? "Channel")
              )}{" "}
              ·{" "}
              {channelTypeLabels[conversation.channel_type ?? ""] ?? conversation.channel_type}
              {conversation.external_contact_name ? ` · ${conversation.external_contact_name}` : ""}
              {typeof conversation.shared_context?.email === "string" &&
              conversation.shared_context.email
                ? ` · ${conversation.shared_context.email}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExecute && conversation.handoff_status === "none" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleHandoff()}
                disabled={actionBusy}
              >
                {handoffMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UserCheck className="size-3.5" />
                )}
                Request handoff
              </Button>
            )}
            {canWrite && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleArchiveToggle()}
                disabled={actionBusy}
              >
                <Archive className="size-3.5" />
                {conversation.archived_at ? "Restore" : "Archive"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
                onClick={() => setConfirmDelete(true)}
                disabled={actionBusy}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <OmnichannelConfirmDialog
        open={confirmDelete}
        title="Delete conversation?"
        description={`Delete "${conversation.subject}"? The conversation will be hidden from the inbox but kept in the audit trail.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setConfirmDelete(false);
        }}
        onConfirm={() => void handleDelete()}
      />

      <div className="grid gap-6 px-6 pt-8 lg:grid-cols-[1fr_320px] md:px-8">
        <OmnichannelConversationThread
          conversationId={conversationId}
          messages={conversation.messages}
          canReply={canExecute}
        />

        <OmnichannelConversationSidebar conversation={conversation} canWrite={canWrite} />
      </div>
    </div>
  );
}
