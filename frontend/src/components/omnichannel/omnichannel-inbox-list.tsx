"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, Inbox, Trash2 } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/config/omnichannel";
import type { OmnichannelInboxItem } from "@/lib/omnichannel/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import {
  OmnichannelChannelTypeBadge,
  OmnichannelHandoffBadge,
  OmnichannelStatusBadge,
} from "./omnichannel-badges";

export function OmnichannelInboxList({
  items,
  emptyMessage = "No conversations in the inbox.",
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  showSelection = false,
  inboxView = "active",
  canWrite = false,
  canDelete = false,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  items: OmnichannelInboxItem[];
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  showSelection?: boolean;
  inboxView?: "active" | "archived";
  canWrite?: boolean;
  canDelete?: boolean;
  onArchive?: (item: OmnichannelInboxItem) => void;
  onUnarchive?: (item: OmnichannelInboxItem) => void;
  onDelete?: (item: OmnichannelInboxItem) => void;
}) {
  if (items.length === 0) {
    const accent = dashboardAccents.purple;

    return (
      <DashboardCard
        variant="panel"
        accent="purple"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl border",
            accent.bgSubtle,
            accent.border,
          )}
        >
          <Inbox className={cn("size-6", accent.text)} />
        </div>
        <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
          Inbox is empty
        </h3>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          {emptyMessage}
        </p>
      </DashboardCard>
    );
  }

  const allSelected =
    showSelection &&
    selectedIds &&
    items.length > 0 &&
    items.every((item) => selectedIds.has(item.id));

  return (
    <div className="space-y-3">
      {showSelection && onToggleSelectAll && (
        <label className="flex items-center gap-2 px-1 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="rounded border-white/20"
          />
          Select all on this page
        </label>
      )}

      {items.map((item) => {
        const isSelected = selectedIds?.has(item.id) ?? false;

        return (
          <DashboardCard
            key={item.id}
            variant="default"
            accent="purple"
            className={cn("p-4", isSelected && "ring-1 ring-purple-400/40")}
          >
            <div className="flex gap-3">
              {showSelection && onToggleSelect && (
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-white/20"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/omnichannel/conversations/${item.id}`}
                        className="truncate text-[14px] font-medium text-foreground hover:text-purple-300"
                      >
                        {item.subject}
                      </Link>
                      {item.channel_type && (
                        <OmnichannelChannelTypeBadge type={item.channel_type} />
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {item.channel_name ?? "Channel"}
                      {item.external_contact_name ? ` · ${item.external_contact_name}` : ""}
                      {typeof item.shared_context?.email === "string" && item.shared_context.email
                        ? ` · ${item.shared_context.email}`
                        : ""}
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

                  <div className="flex flex-wrap items-center gap-2">
                    <OmnichannelStatusBadge status={item.status} />
                    <OmnichannelHandoffBadge status={item.handoff_status} />
                  </div>
                </div>

                {(canWrite || canDelete) && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                    {canWrite && inboxView === "active" && onArchive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[12px]"
                        onClick={() => onArchive(item)}
                      >
                        <Archive className="mr-1.5 size-3.5" />
                        Archive
                      </Button>
                    )}
                    {canWrite && inboxView === "archived" && onUnarchive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[12px]"
                        onClick={() => onUnarchive(item)}
                      >
                        <ArchiveRestore className="mr-1.5 size-3.5" />
                        Restore
                      </Button>
                    )}
                    {canDelete && onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[12px] text-red-400 hover:text-red-300"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="mr-1.5 size-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DashboardCard>
        );
      })}
    </div>
  );
}
