"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useSupportAnalytics,
  useSupportCategories,
  useSupportTickets,
} from "@/hooks/use-support-tickets";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/customer-support/access";
import type { SupportTicketPriority, SupportTicketStatus } from "@/lib/customer-support/types";
import { cn } from "@/lib/utils";

import { CreateTicketModal } from "./create-ticket-modal";
import { CustomerSupportAccessDenied } from "./customer-support-access-denied";
import { CustomerSupportEmptyState } from "./customer-support-empty-state";
import { CustomerSupportError } from "./customer-support-error";
import { CustomerSupportHero } from "./customer-support-hero";
import { SupportTicketCardGridSkeleton } from "./customer-support-skeleton";
import { CustomerSupportStats } from "./customer-support-stats";
import { ManageCategoriesPanel } from "./manage-categories-panel";
import { SupportTicketCardGrid } from "./support-ticket-card";

type StatusFilter = SupportTicketStatus | "all";
type PriorityFilter = SupportTicketPriority | "all";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function CustomerSupportPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const permissions = useUserPermissions();
  const canCreate = hasPermission(permissions, PERMISSIONS.SUPPORT_TICKETS_WRITE);
  const canManageCategories = hasPermission(permissions, PERMISSIONS.SUPPORT_CATEGORIES_WRITE);

  const {
    data: tickets = [],
    isLoading: isLoadingTickets,
    isError: isTicketsError,
    error: ticketsError,
    refetch: refetchTickets,
  } = useSupportTickets();

  const {
    data: categories = [],
  } = useSupportCategories();

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useSupportAnalytics();

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && ticket.category_id !== categoryFilter) return false;
      if (
        unassignedOnly &&
        (ticket.assigned_user_id || ticket.assigned_ai_employee_id)
      ) {
        return false;
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, unassignedOnly]);

  const ticketsAccessDenied = isTicketsError && isAccessDeniedError(ticketsError);
  const analyticsErrorMessage = isAnalyticsError
    ? getApiErrorMessage(analyticsError, "Failed to load support analytics.")
    : null;
  const ticketsErrorMessage = isTicketsError
    ? getApiErrorMessage(ticketsError, "Failed to load support tickets.")
    : null;

  if (ticketsAccessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <CustomerSupportAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <CustomerSupportHero
        tickets={tickets}
        analytics={analytics}
        analyticsAvailable={!isAnalyticsError && Boolean(analytics)}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Overview"
            title="Support metrics"
            description="Track open tickets, unassigned issues, and recent activity across your organization."
          />
          <CustomerSupportStats
            tickets={tickets}
            analytics={isAnalyticsError ? undefined : analytics}
            isLoading={isLoadingTickets || isLoadingAnalytics}
            isError={isAnalyticsError}
            errorMessage={analyticsErrorMessage}
            onRetry={() => void refetchAnalytics()}
          />
        </section>

        <section className="px-6 md:px-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <DashboardSectionHeader
              eyebrow="Queue"
              title="All tickets"
              description="Filter by status, priority, category, or assignment."
              className="mb-0"
            />
            {canManageCategories && (
              <button
                type="button"
                onClick={() => setCategoriesOpen(true)}
                className="shrink-0 text-[13px] font-medium text-[#6B9BF8] hover:underline"
              >
                Manage categories
              </button>
            )}
          </div>

          {isLoadingTickets ? (
            <SupportTicketCardGridSkeleton />
          ) : isTicketsError ? (
            <CustomerSupportError
              title="Failed to load tickets"
              message={ticketsErrorMessage ?? "Could not load support tickets."}
              onRetry={() => void refetchTickets()}
            />
          ) : tickets.length === 0 ? (
            <CustomerSupportEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      statusFilter === filter.value
                        ? "border-[#6B9BF8]/30 bg-[#6B9BF8]/10 text-[#6B9BF8]"
                        : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as PriorityFilter)
                  }
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-foreground outline-none"
                >
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-foreground outline-none"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={unassignedOnly}
                    onChange={(event) => setUnassignedOnly(event.target.checked)}
                    className="rounded border-white/20"
                  />
                  Unassigned only
                </label>
              </div>
              <SupportTicketCardGrid tickets={filteredTickets} />
            </>
          )}
        </section>
      </div>

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageCategoriesPanel
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </div>
  );
}
