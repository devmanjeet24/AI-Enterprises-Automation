"use client";

import { ArrowRight, Filter, MessageSquare, User } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate, getTicketInitials } from "@/config/customer-support";
import type { SupportTicket } from "@/lib/customer-support/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import {
  SupportTicketPriorityBadge,
  SupportTicketStatusBadge,
} from "./support-ticket-badges";

interface SupportTicketCardProps {
  ticket: SupportTicket;
}

export function SupportTicketCard({ ticket }: SupportTicketCardProps) {
  const accent = dashboardAccents.blue;

  return (
    <Link href={`/customer-support/${ticket.id}`} className="block">
      <DashboardCard variant="default" accent="blue" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getTicketInitials(ticket.subject)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {ticket.subject}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {ticket.slug}
              </p>
            </div>
          </div>
          <SupportTicketStatusBadge status={ticket.status} />
        </div>

        {ticket.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {ticket.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <SupportTicketPriorityBadge priority={ticket.priority} />
              {ticket.customer_name && (
                <>
                  <span className="text-tertiary">·</span>
                  <User className="size-3.5" />
                  {ticket.customer_name}
                </>
              )}
            </span>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(ticket.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <MessageSquare className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}

interface SupportTicketCardGridProps {
  tickets: SupportTicket[];
}

export function SupportTicketCardGrid({ tickets }: SupportTicketCardGridProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <Filter className="size-6 text-tertiary" />
        <p className="mt-3 text-[14px] text-muted-foreground">
          No tickets match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => (
        <SupportTicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
