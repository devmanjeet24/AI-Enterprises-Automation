"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { channelTypeLabels, formatDateTime } from "@/config/omnichannel";
import {
  useCreateOmnichannelConversation,
  useInbox,
  useOmnichannelChannel,
} from "@/hooks/use-omnichannel";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/omnichannel/access";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { OmnichannelAccessDenied } from "./omnichannel-access-denied";
import {
  OmnichannelActiveBadge,
  OmnichannelChannelTypeBadge,
} from "./omnichannel-badges";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelInboxList } from "./omnichannel-inbox-list";
import { OmnichannelDetailSkeleton, OmnichannelInboxSkeleton } from "./omnichannel-skeleton";

export function OmnichannelChannelDetailPage({ channelId }: { channelId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const permissions = useUserPermissions();
  const canWrite = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CONVERSATIONS_WRITE);

  const { data: channel, isLoading, isError, error, refetch } = useOmnichannelChannel(channelId);
  const { data: inbox = [], isLoading: loadingInbox } = useInbox({ channel_id: channelId });
  const createConversation = useCreateOmnichannelConversation();

  if (isLoading) return <OmnichannelDetailSkeleton />;

  if (isError && isAccessDeniedError(error)) {
    return (
      <div className="px-6 py-10 md:px-8">
        <OmnichannelAccessDenied message="You do not have permission to view this channel." />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <div className="px-6 py-10 md:px-8">
        <OmnichannelError
          message={getApiErrorMessage(error, "Could not load channel.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!channel) notFound();

  const handleNewConversation = async () => {
    if (!canWrite) return;
    setCreating(true);
    try {
      const conversation = await createConversation.mutateAsync({
        channel_id: channel.id,
        subject: `Conversation on ${channel.name}`,
        external_contact_name: "Demo Customer",
        initial_message: "Hello, I need help with my account.",
      });
      toast.success("Conversation created");
      router.push(`/omnichannel/conversations/${conversation.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create conversation."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link href="/omnichannel" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Back to omnichannel
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold text-foreground">{channel.name}</h1>
              <OmnichannelActiveBadge isActive={channel.is_active} />
              <OmnichannelChannelTypeBadge type={channel.channel_type} />
            </div>
            <p className="mt-1 font-mono text-[12px] text-tertiary">{channel.slug}</p>
          </div>
          {canWrite && (
            <Button variant="brand" size="sm" onClick={() => void handleNewConversation()} disabled={creating || !channel.is_active}>
              {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              New conversation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-6 pt-8 md:grid-cols-3 md:px-8">
        <DashboardCard variant="panel" accent="purple" className="p-5 md:col-span-1">
          <h3 className="text-[14px] font-medium text-foreground">Channel details</h3>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="mt-0.5">{channelTypeLabels[channel.channel_type]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AI employee</dt>
              <dd className="mt-0.5">
                {channel.ai_employee_id ? (
                  <Link
                    href={`/ai-employees/${channel.ai_employee_id}`}
                    className="font-medium text-foreground transition-colors hover:text-brand"
                  >
                    {channel.ai_employee_name ?? "View employee"}
                  </Link>
                ) : (
                  (channel.ai_employee_name ?? "—")
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Conversations</dt>
              <dd className="mt-0.5">{channel.conversation_count}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="mt-0.5">{formatDateTime(channel.created_at)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] text-muted-foreground">
            Simulated connector — no external Telegram or Slack APIs.
          </p>
        </DashboardCard>

        <div className="md:col-span-2">
          <h3 className="mb-4 text-[14px] font-medium text-foreground">Channel inbox</h3>
          {loadingInbox ? (
            <OmnichannelInboxSkeleton />
          ) : (
            <OmnichannelInboxList items={inbox} emptyMessage="No conversations on this channel yet." />
          )}
        </div>
      </div>
    </div>
  );
}
