"use client";

import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getWorkflowInitials } from "@/config/workflows";
import {
  useWorkflow,
  useWorkflowExecutions,
} from "@/hooks/use-workflows";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { isAccessDeniedError } from "@/lib/workflows/access";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { WorkflowBuilder } from "./workflow-builder";
import { WorkflowConfigPanel } from "./workflow-config-panel";
import { WorkflowDetailActions } from "./workflow-detail-actions";
import { WorkflowDetailTabs, type WorkflowDetailTab } from "./workflow-detail-tabs";
import { WorkflowExecutionHistory } from "./workflow-execution-history";
import { WorkflowExecutionPanel } from "./workflow-execution-panel";
import { WorkflowDetailSkeleton } from "./workflow-list-skeleton";
import { WorkflowSchedulePanel } from "./workflow-schedule-panel";
import { WorkflowSetupChecklist } from "./workflow-setup-checklist";
import { WorkflowStatusBadge } from "./workflow-status-badge";
import { WorkflowsAccessDenied } from "./workflows-access-denied";
import { WorkflowsError } from "./workflows-error";
import { WorkflowsStats } from "./workflows-stats";

interface WorkflowDetailPageProps {
  workflowId: string;
}

export function WorkflowDetailPage({ workflowId }: WorkflowDetailPageProps) {
  const accent = dashboardAccents.purple;
  const [activeTab, setActiveTab] = useState<WorkflowDetailTab>("configure");
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.WORKFLOWS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.WORKFLOWS_DELETE);

  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    isError: isWorkflowError,
    error: workflowError,
    refetch: refetchWorkflow,
  } = useWorkflow(workflowId);

  const {
    executions,
    isLoading: isExecutionsLoading,
    isError: isExecutionsError,
    error: executionsError,
    refetch: refetchExecutions,
  } = useWorkflowExecutions(workflowId);

  if (isWorkflowLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <WorkflowDetailSkeleton />
      </div>
    );
  }

  if (isWorkflowError) {
    if (workflowError instanceof ApiError && workflowError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(workflowError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <WorkflowsAccessDenied message="You do not have permission to view this workflow." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <WorkflowsError
          title="Failed to load workflow"
          message={getApiErrorMessage(workflowError, "Could not load this workflow.")}
          onRetry={() => refetchWorkflow()}
        />
      </div>
    );
  }

  if (!workflow) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
        <Link href="/workflows">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            Back to Workflows
          </Button>
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getWorkflowInitials(workflow.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Workflow
              </p>
              <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
                {workflow.name}
              </h1>
              <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                {workflow.slug}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <WorkflowStatusBadge status={workflow.status} />
                <span className="text-[12px] text-muted-foreground">
                  Team:{" "}
                  <Link
                    href={`/agent-teams/${workflow.agent_team_id}`}
                    className="font-medium text-foreground transition-colors hover:text-brand"
                  >
                    {workflow.agent_team_name}
                  </Link>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs shrink-0">
            <WorkflowDetailActions
              workflow={workflow}
              canWrite={canWrite}
              canDelete={canDelete}
              onRunClick={() => setActiveTab("execute")}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <WorkflowsStats workflows={[workflow]} executions={executions} />
        <WorkflowSetupChecklist workflow={workflow} />
        <WorkflowDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "configure" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkflowConfigPanel workflow={workflow} canWrite={canWrite} />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2">
                <GitBranch className={cn("size-4", accent.text)} />
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                  Pipeline summary
                </p>
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Steps</dt>
                  <dd className="font-medium text-foreground">
                    {workflow.steps.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Runs</dt>
                  <dd className="font-medium text-foreground">{executions.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Agent team</dt>
                  <dd className="font-medium text-foreground">
                    <Link
                      href={`/agent-teams/${workflow.agent_team_id}`}
                      className="transition-colors hover:text-brand"
                    >
                      {workflow.agent_team_name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Runnable</dt>
                  <dd className="font-medium text-foreground">
                    {workflow.is_active &&
                    workflow.status === "active" &&
                    workflow.steps.length > 0
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "builder" && (
          <WorkflowBuilder workflow={workflow} canWrite={canWrite} />
        )}
        {activeTab === "execute" && (
          <>
            {isExecutionsError ? (
              <WorkflowsError
                title="Failed to load runs"
                message={getApiErrorMessage(
                  executionsError,
                  "Could not load workflow runs.",
                )}
                onRetry={() => refetchExecutions()}
              />
            ) : (
              <WorkflowExecutionPanel
                workflow={workflow}
                executions={executions}
                executionsLoading={isExecutionsLoading}
                canWrite={canWrite}
              />
            )}
          </>
        )}
        {activeTab === "history" && (
          <>
            {isExecutionsError ? (
              <WorkflowsError
                title="Failed to load execution history"
                message={getApiErrorMessage(
                  executionsError,
                  "Could not load execution history.",
                )}
                onRetry={() => refetchExecutions()}
              />
            ) : (
              <WorkflowExecutionHistory
                executions={executions}
                isLoading={isExecutionsLoading}
              />
            )}
          </>
        )}
        {activeTab === "schedule" && (
          <WorkflowSchedulePanel workflow={workflow} />
        )}
      </div>
    </div>
  );
}
