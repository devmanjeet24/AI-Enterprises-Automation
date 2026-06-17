"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useInbox,
  useOmnichannelAnalytics,
  useOmnichannelChannels,
} from "@/hooks/use-omnichannel";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/omnichannel/access";
import type {
  OmnichannelChannelType,
  OmnichannelConversationStatus,
} from "@/lib/omnichannel/types";
import { cn } from "@/lib/utils";

import { CreateOmnichannelChannelModal } from "./create-omnichannel-channel-modal";
import { OmnichannelAccessDenied } from "./omnichannel-access-denied";
import { OmnichannelChannelGrid } from "./omnichannel-channel-card";
import { OmnichannelEmptyState } from "./omnichannel-empty-state";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelHero } from "./omnichannel-hero";
import { OmnichannelInboxList } from "./omnichannel-inbox-list";
import {
  OmnichannelChannelGridSkeleton,
  OmnichannelInboxSkeleton,
  OmnichannelStatsSkeleton,
} from "./omnichannel-skeleton";
import { OmnichannelStats } from "./omnichannel-stats";

type ChannelFilter = OmnichannelChannelType | "all";
type StatusFilter = OmnichannelConversationStatus | "all";

export function OmnichannelPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const permissions = useUserPermissions();
  const canCreateChannel = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CHANNELS_WRITE);

  const {
    data: channels = [],
    isLoading: loadingChannels,
    isError: channelsError,
    error: channelsErr,
    refetch: refetchChannels,
  } = useOmnichannelChannels();

  const {
    data: analytics,
    isLoading: loadingAnalytics,
    isError: analyticsError,
    error: analyticsErr,
    refetch: refetchAnalytics,
  } = useOmnichannelAnalytics();

  const inboxParams = useMemo(
    () => ({
      channel_type: channelFilter === "all" ? undefined : channelFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      unassigned_only: unassignedOnly,
    }),
    [channelFilter, statusFilter, unassignedOnly],
  );

  const {
    data: inbox = [],
    isLoading: loadingInbox,
    isError: inboxError,
    error: inboxErr,
    refetch: refetchInbox,
  } = useInbox(inboxParams);

  const channelsAccessDenied = channelsError && isAccessDeniedError(channelsErr);
  const inboxAccessDenied = inboxError && isAccessDeniedError(inboxErr);
  const canReadChannels = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CHANNELS_READ);
  const canReadInbox = hasPermission(
    permissions,
    PERMISSIONS.OMNICHANNEL_CONVERSATIONS_READ,
  );
  const fullAccessDenied =
    (!canReadChannels && !canReadInbox) ||
    (channelsAccessDenied && inboxAccessDenied);

  if (fullAccessDenied) {
    return (
      <div className="px-6 py-10 md:px-8">
        <OmnichannelAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <OmnichannelHero
        channels={channels}
        analytics={analytics}
        canCreate={canCreateChannel}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Overview"
            title="Omnichannel metrics"
            description="Monitor active channels, open conversations, and pending handoffs."
          />
          {loadingChannels || loadingAnalytics ? (
            <OmnichannelStatsSkeleton />
          ) : (
            <OmnichannelStats
              channels={channels}
              analytics={analytics}
              isLoading={false}
              isError={analyticsError}
              errorMessage={
                analyticsError
                  ? getApiErrorMessage(analyticsErr, "Failed to load analytics.")
                  : null
              }
              onRetry={() => void refetchAnalytics()}
            />
          )}
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader title="Channels" description="Manage communication channels" />
          {loadingChannels ? (
            <OmnichannelChannelGridSkeleton />
          ) : channelsAccessDenied ? (
            <OmnichannelAccessDenied />
          ) : channelsError ? (
            <OmnichannelError
              title="Failed to load channels"
              message={getApiErrorMessage(channelsErr, "Could not load channels.")}
              onRetry={() => void refetchChannels()}
            />
          ) : channels.length === 0 ? (
            <OmnichannelEmptyState
              canCreate={canCreateChannel}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <OmnichannelChannelGrid channels={channels} />
          )}
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            title="Unified inbox"
            description={
              loadingInbox
                ? "Loading conversations…"
                : `${inbox.length} conversation${inbox.length === 1 ? "" : "s"}`
            }
          />

          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "website_chat", "telegram", "slack", "internal"] as ChannelFilter[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannelFilter(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                    channelFilter === value
                      ? "border-purple-400/40 bg-purple-400/10 text-purple-300"
                      : "border-white/[0.08] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value === "all" ? "All channels" : value.replace("_", " ")}
                </button>
              ),
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px]"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="ai_handling">AI Handling</option>
              <option value="waiting_human">Waiting Human</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
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

          {loadingInbox ? (
            <OmnichannelInboxSkeleton />
          ) : inboxAccessDenied ? (
            <OmnichannelAccessDenied />
          ) : inboxError ? (
            <OmnichannelError
              title="Failed to load inbox"
              message={getApiErrorMessage(inboxErr, "Could not load inbox.")}
              onRetry={() => void refetchInbox()}
            />
          ) : (
            <OmnichannelInboxList items={inbox} />
          )}
        </section>
      </div>

      {canCreateChannel && (
        <CreateOmnichannelChannelModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
