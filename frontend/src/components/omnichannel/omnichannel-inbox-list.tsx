"use client";

import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate } from "@/config/omnichannel";
import type { OmnichannelInboxItem } from "@/lib/omnichannel/types";

import {
  OmnichannelChannelTypeBadge,
  OmnichannelHandoffBadge,
  OmnichannelStatusBadge,
} from "./omnichannel-badges";

export function OmnichannelInboxList({
  items,
  emptyMessage = "No conversations in the inbox.",
}: {
  items: OmnichannelInboxItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <DashboardCard variant="panel" accent="purple" className="flex flex-col items-center px-6 py-16 text-center">
        <p className="text-[14px] text-muted-foreground">{emptyMessage}</p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link key={item.id} href={`/omnichannel/conversations/${item.id}`}>
          <DashboardCard variant="default" accent="purple" className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-[14px] font-medium text-foreground">{item.subject}</h3>
                  {item.channel_type && (
                    <OmnichannelChannelTypeBadge type={item.channel_type} />
                  )}
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {item.channel_name ?? "Channel"}
                  {item.external_contact_name ? ` · ${item.external_contact_name}` : ""}
                </p>
                {item.last_message_preview && (
                  <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                    {item.last_message_preview}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-tertiary">
                  {item.message_count} message{item.message_count === 1 ? "" : "s"} ·{" "}
                  {formatRelativeDate(item.last_message_at ?? item.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <OmnichannelStatusBadge status={item.status} />
                <OmnichannelHandoffBadge status={item.handoff_status} />
              </div>
            </div>
          </DashboardCard>
        </Link>
      ))}
    </div>
  );
}
