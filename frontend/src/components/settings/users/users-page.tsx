"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { filterUsersByStatus } from "@/config/users";
import { useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import { isAccessDeniedError } from "@/lib/users/access";
import type { UserStatusFilter } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { UsersAccessDenied } from "./users-access-denied";
import { UsersEmptyState } from "./users-empty-state";
import { UsersError } from "./users-error";
import { UsersHero } from "./users-hero";
import { UsersSkeleton } from "./users-skeleton";
import { UsersStats } from "./users-stats";
import { UserCardGrid } from "./user-card-grid";

const statusFilters: { value: UserStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function UsersPage() {
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const accent = dashboardAccents.emerald;

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useUsers();

  const filteredUsers = useMemo(
    () => filterUsersByStatus(users, statusFilter),
    [users, statusFilter],
  );

  const accessDenied = isError && isAccessDeniedError(error);
  const errorMessage = isError
    ? getApiErrorMessage(error, "Failed to load users.")
    : null;

  if (isLoading) {
    return (
      <div className="pb-10 md:pb-12">
        <UsersSkeleton />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <UsersAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <UsersHero users={users} />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Directory"
            title="User overview"
            description="Monitor active accounts, administrators, and inactive users across your organization."
          />
          <UsersStats users={users} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Accounts"
            title="Organization users"
            description="Open a user to edit their profile, manage roles, or change account status."
          />

          {isError ? (
            <UsersError
              title="Failed to load users"
              message={errorMessage!}
              onRetry={() => refetch()}
            />
          ) : users.length === 0 ? (
            <UsersEmptyState />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                      statusFilter === filter.value
                        ? cn(accent.bgSubtle, accent.border, accent.text)
                        : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <UserCardGrid users={filteredUsers} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
