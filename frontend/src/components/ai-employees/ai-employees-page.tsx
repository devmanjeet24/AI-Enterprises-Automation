"use client";

import { useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { useEmployees } from "@/hooks/use-ai-employees";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import type { AIEmployeeStatus } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AiEmployeesHero } from "./ai-employees-hero";
import { AiEmployeesStats } from "./ai-employees-stats";
import { AiEmployeesError } from "./ai-employees-error";
import { CreateEmployeeModal } from "./create-employee-modal";
import { EmployeeCardGrid } from "./employee-card-grid";
import { EmployeeEmptyState } from "./employee-empty-state";
import { EmployeeCardGridSkeleton } from "./employee-list-skeleton";

const statusFilters: { value: AIEmployeeStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function AiEmployeesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AIEmployeeStatus | "all">("all");
  const accent = dashboardAccents.emerald;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.EMPLOYEES_WRITE);

  const { data: employees = [], isLoading, isError, error, refetch } =
    useEmployees("all");

  const errorMessage = isError
    ? getApiErrorMessage(error, "Failed to load AI employees.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <AiEmployeesHero
        employees={employees}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Workforce"
            title="Employee overview"
            description="Monitor active agents, knowledge coverage, and readiness across your AI team."
          />
          <AiEmployeesStats employees={employees} isLoading={isLoading} />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Studio"
            title="Your AI employees"
            description="Configure, activate, and chat with knowledge-grounded agents."
          />

          {isLoading ? (
            <EmployeeCardGridSkeleton />
          ) : isError ? (
            <AiEmployeesError
              title="Failed to load employees"
              message={errorMessage!}
              onRetry={() => refetch()}
            />
          ) : employees.length === 0 ? (
            <EmployeeEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                      statusFilter === filter.value
                        ? cn(accent.bgSubtle, accent.border, accent.text)
                        : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <EmployeeCardGrid employees={employees} statusFilter={statusFilter} />
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateEmployeeModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
