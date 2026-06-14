"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { OmnichannelChannel } from "@/lib/omnichannel/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { OmnichannelActiveBadge, OmnichannelChannelTypeBadge } from "./omnichannel-badges";

export function OmnichannelChannelCard({ channel }: { channel: OmnichannelChannel }) {
  const accent = dashboardAccents.purple;
  return (
    <Link href={`/omnichannel/channels/${channel.id}`} className="block">
      <DashboardCard variant="default" accent="purple" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-medium text-foreground">{channel.name}</h3>
            <p className="mt-0.5 font-mono text-[12px] text-tertiary">{channel.slug}</p>
          </div>
          <OmnichannelActiveBadge isActive={channel.is_active} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <OmnichannelChannelTypeBadge type={channel.channel_type} />
        </div>
        {channel.description && (
          <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{channel.description}</p>
        )}
        <div className={cn("mt-5 flex items-center gap-1 text-[12px] font-medium", accent.text)}>
          Manage channel
          <ArrowRight className="size-3" />
        </div>
      </DashboardCard>
    </Link>
  );
}

export function OmnichannelChannelGrid({ channels }: { channels: OmnichannelChannel[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {channels.map((channel) => (
        <OmnichannelChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
