"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { channelTypeLabels } from "@/config/omnichannel";
import {
  useOmnichannelConversation,
  useRequestHumanHandoff,
} from "@/hooks/use-omnichannel";
import { useOmnichannelRealtime } from "@/hooks/use-omnichannel-realtime";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/omnichannel/access";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { OmnichannelAccessDenied } from "./omnichannel-access-denied";
import {
  OmnichannelHandoffBadge,
  OmnichannelStatusBadge,
} from "./omnichannel-badges";
import { OmnichannelConversationThread } from "./omnichannel-conversation-thread";
import { OmnichannelConversationSidebar } from "./omnichannel-conversation-sidebar";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelConversationDetailSkeleton } from "./omnichannel-skeleton";

export function OmnichannelConversationDetailPage({
  conversationId,
}: {
  conversationId: string;
}) {
  const toast = useToast();
  const permissions = useUserPermissions();
  const canExecute = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_EXECUTE);
  const canWrite = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_WRITE);
  useOmnichannelRealtime();

  const { data: conversation, isLoading, isError, error, refetch } =
    useOmnichannelConversation(conversationId);
  const handoffMutation = useRequestHumanHandoff(conversationId);

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
            </p>
          </div>
          {canExecute && conversation.handoff_status === "none" && (
            <Button variant="secondary" size="sm" onClick={() => void handleHandoff()} disabled={handoffMutation.isPending}>
              {handoffMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserCheck className="size-3.5" />
              )}
              Request handoff
            </Button>
          )}
        </div>
      </div>

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
