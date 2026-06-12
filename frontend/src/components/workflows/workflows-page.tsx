"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { useWorkflowsOverview } from "@/hooks/use-workflows";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import type { WorkflowStatus } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { CreateWorkflowModal } from "./create-workflow-modal";
import { WorkflowCardGrid } from "./workflow-card-grid";
import { WorkflowCardGridSkeleton } from "./workflow-list-skeleton";
import { WorkflowEmptyState } from "./workflow-empty-state";
import { WorkflowsError } from "./workflows-error";
import { WorkflowsHero } from "./workflows-hero";
import { WorkflowsStats } from "./workflows-stats";

type StatusFilter = WorkflowStatus | "all";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export function WorkflowsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const accent = dashboardAccents.purple;
  const permissions = useUserPermissions();

  const canCreate = hasPermission(permissions, PERMISSIONS.WORKFLOWS_WRITE);

  const { workflows, executions, isLoading, isError, error, refetch } =
    useWorkflowsOverview();

  const filteredWorkflows = useMemo(() => {
    if (statusFilter === "all") return workflows;
    return workflows.filter((workflow) => workflow.status === statusFilter);
  }, [workflows, statusFilter]);

  const errorMessage = isError
    ? getApiErrorMessage(error, "Failed to load workflows.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <WorkflowsHero
        workflows={workflows}
        executions={executions}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Automation"
            title="Workflow overview"
            description="Monitor active pipelines, step coverage, and run completion across your organization."
          />
          <WorkflowsStats
            workflows={workflows}
            executions={executions}
            isLoading={isLoading}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Studio"
            title="Your workflows"
            description="Build, configure, and run multi-step automation pipelines."
          />

          {isLoading ? (
            <WorkflowCardGridSkeleton />
          ) : isError ? (
            <WorkflowsError
              title="Failed to load workflows"
              message={errorMessage!}
              onRetry={() => refetch()}
            />
          ) : workflows.length === 0 ? (
            <WorkflowEmptyState
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
              <WorkflowCardGrid workflows={filteredWorkflows} />
            </>
          )}
        </section>
      </div>

      {canCreate && (
        <CreateWorkflowModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}
