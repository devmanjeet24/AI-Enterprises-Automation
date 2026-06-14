"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, User } from "lucide-react";

import { useSupportTicket } from "@/hooks/use-support-tickets";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/customer-support/access";
import { formatDateTime, getTicketInitials } from "@/config/customer-support";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CustomerSupportAccessDenied } from "./customer-support-access-denied";
import { CustomerSupportDetailPageSkeleton } from "./customer-support-skeleton";
import { CustomerSupportError } from "./customer-support-error";
import {
  SupportTicketPriorityBadge,
  SupportTicketStatusBadge,
} from "./support-ticket-badges";
import { SupportTicketConversation } from "./support-ticket-conversation";
import { SupportTicketSidebar } from "./support-ticket-sidebar";

interface CustomerSupportDetailPageProps {
  ticketId: string;
}

export function CustomerSupportDetailPage({ ticketId }: CustomerSupportDetailPageProps) {
  const permissions = useUserPermissions();
  const canWrite = hasPermission(permissions, PERMISSIONS.SUPPORT_TICKETS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.SUPPORT_TICKETS_DELETE);
  const canExecute = hasPermission(permissions, PERMISSIONS.SUPPORT_TICKETS_EXECUTE);

  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useSupportTicket(ticketId);

  const accent = dashboardAccents.blue;

  if (isLoading) {
    return <CustomerSupportDetailPageSkeleton />;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(error)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <CustomerSupportAccessDenied message="You do not have permission to view this support ticket." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <CustomerSupportError
          title="Failed to load ticket"
          message={getApiErrorMessage(error, "Could not load this ticket.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!ticket) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link
          href="/customer-support"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to support
        </Link>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getTicketInitials(ticket.subject)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                  {ticket.subject}
                </h1>
                <SupportTicketStatusBadge status={ticket.status} />
                <SupportTicketPriorityBadge priority={ticket.priority} />
              </div>
              <p className="mt-1 font-mono text-[12px] text-tertiary">{ticket.slug}</p>
              {ticket.description && (
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                  {ticket.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                {ticket.customer_name && (
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    {ticket.customer_name}
                  </span>
                )}
                {ticket.customer_email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {ticket.customer_email}
                  </span>
                )}
                {ticket.category_name && (
                  <span>Category: {ticket.category_name}</span>
                )}
                <span>Updated {formatDateTime(ticket.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-8 md:px-8 lg:grid-cols-[1fr_320px]">
        <SupportTicketConversation ticketId={ticketId} canReply={canExecute} />
        <SupportTicketSidebar
          ticket={ticket}
          canWrite={canWrite}
          canDelete={canDelete}
          canExecute={canExecute}
        />
      </div>
    </div>
  );
}
