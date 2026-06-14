"use client";

import { Headphones, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SupportAnalytics, SupportTicket } from "@/lib/customer-support/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface CustomerSupportHeroProps {
  tickets: SupportTicket[];
  analytics?: SupportAnalytics | null;
  analyticsAvailable?: boolean;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function CustomerSupportHero({
  tickets,
  analytics,
  analyticsAvailable = false,
  canCreate = false,
  onCreateClick,
}: CustomerSupportHeroProps) {
  const accent = dashboardAccents.blue;
  const openCount = analytics?.open_tickets ?? tickets.filter((t) => t.status === "open").length;
  const recentCount = analytics?.recent_tickets_7d ?? null;

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent",
          accent.glow,
        )}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <Headphones className={cn("size-4", accent.text)} />
            </div>
            <span className={cn("text-[12px] font-medium uppercase tracking-wider", accent.textMuted)}>
              Customer Support
            </span>
          </div>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-foreground md:text-[32px]">
            Support tickets
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Manage customer issues, assign agents and AI employees, and track
            conversations through resolution.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
            <span>
              <strong className="text-foreground">{openCount}</strong> open
            </span>
            {analyticsAvailable && recentCount != null && (
              <span>
                <strong className="text-foreground">{recentCount}</strong> new this week
              </span>
            )}
          </div>
        </div>
        {canCreate && onCreateClick && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create ticket
          </Button>
        )}
      </div>
    </section>
  );
}
