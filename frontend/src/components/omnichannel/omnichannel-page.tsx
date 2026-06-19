"use client";

import { useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useOmnichannelAnalytics,
  useOmnichannelChannels,
} from "@/hooks/use-omnichannel";
import { useOmnichannelRealtime } from "@/hooks/use-omnichannel-realtime";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/omnichannel/access";
import type { OmnichannelChannelType } from "@/lib/omnichannel/types";
import { cn } from "@/lib/utils";

import { CreateOmnichannelChannelModal } from "./create-omnichannel-channel-modal";
import { OmnichannelAccessDenied } from "./omnichannel-access-denied";
import { OmnichannelAnalyticsDashboard } from "@/components/analytics/omnichannel-analytics-dashboard";
import { OmnichannelChannelGrid } from "./omnichannel-channel-card";
import { OmnichannelEmptyState } from "./omnichannel-empty-state";
import { OmnichannelError } from "./omnichannel-error";
import { OmnichannelHero } from "./omnichannel-hero";
import { OmnichannelInboxPanel } from "./omnichannel-inbox-panel";
import {
  OmnichannelChannelGridSkeleton,
  OmnichannelStatsSkeleton,
} from "./omnichannel-skeleton";
import { OmnichannelStats } from "./omnichannel-stats";

type ChannelFilter = OmnichannelChannelType | "all";

export function OmnichannelPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");

  const permissions = useUserPermissions();
  const canCreateChannel = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CHANNELS_WRITE);
  useOmnichannelRealtime();

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

  const channelsAccessDenied = channelsError && isAccessDeniedError(channelsErr);
  const canReadChannels = hasPermission(permissions, PERMISSIONS.OMNICHANNEL_CHANNELS_READ);
  const canReadInbox = hasPermission(
    permissions,
    PERMISSIONS.OMNICHANNEL_CONVERSATIONS_READ,
  );
  const fullAccessDenied = !canReadChannels && !canReadInbox;

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
          <OmnichannelAnalyticsDashboard
            analytics={analytics}
            isLoading={loadingAnalytics}
            isError={analyticsError}
            errorMessage={
              analyticsError
                ? getApiErrorMessage(analyticsErr, "Failed to load analytics.")
                : null
            }
            onRetry={() => void refetchAnalytics()}
          />
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

        {canReadInbox && (
          <section className="px-6 md:px-8">
            <DashboardSectionHeader
              title="Unified inbox"
              description="Manage, archive, and clean up test conversations."
            />

            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  "all",
                  "website_chat",
                  "telegram",
                  "slack",
                  "email",
                  "whatsapp",
                  "internal",
                ] as ChannelFilter[]
              ).map((value) => (
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
              ))}
            </div>

            <OmnichannelInboxPanel
              channelTypeFilter={channelFilter === "all" ? undefined : channelFilter}
            />
          </section>
        )}
      </div>

      {canCreateChannel && (
        <CreateOmnichannelChannelModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
