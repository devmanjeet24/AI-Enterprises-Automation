"use client";

import { Inbox, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OmnichannelAnalytics, OmnichannelChannel } from "@/lib/omnichannel/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface OmnichannelHeroProps {
  channels: OmnichannelChannel[];
  analytics?: OmnichannelAnalytics | null;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function OmnichannelHero({
  channels,
  analytics,
  canCreate = false,
  onCreateClick,
}: OmnichannelHeroProps) {
  const accent = dashboardAccents.purple;
  const activeCount =
    analytics?.active_channels ?? channels.filter((c) => c.is_active).length;

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent", accent.glow)} />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className={cn("flex size-8 items-center justify-center rounded-lg border", accent.bgSubtle, accent.border)}>
              <Inbox className={cn("size-4", accent.text)} />
            </div>
            <span className={cn("text-[12px] font-medium uppercase tracking-wider", accent.textMuted)}>
              Omnichannel Communication
            </span>
          </div>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-foreground md:text-[32px]">
            Unified inbox
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Manage Website Chat, Telegram, Slack, and Internal messaging from one
            place with shared context, AI suggestions, and human handoff.
          </p>
          <p className="mt-4 text-[13px] text-muted-foreground">
            <strong className="text-foreground">{activeCount}</strong> active channels
          </p>
        </div>
        {canCreate && onCreateClick && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Add channel
          </Button>
        )}
      </div>
    </section>
  );
}
