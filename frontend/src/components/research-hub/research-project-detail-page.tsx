"use client";

import { notFound } from "next/navigation";
import { useRef, useState } from "react";

import {
  useProjectResearchReports,
  useResearchExecutions,
  useResearchProject,
} from "@/hooks/use-research-projects";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/research-hub/access";

import { ResearchHubAccessDenied } from "./research-hub-access-denied";
import { ResearchHubError } from "./research-hub-error";
import { ResearchProjectDetailSkeleton } from "./research-hub-skeleton";
import { ResearchProjectActions } from "./research-project-actions";
import { ResearchProjectBriefPanel } from "./research-project-brief-panel";
import {
  ResearchProjectDetailTabs,
  type ResearchProjectDetailTab,
} from "./research-project-detail-tabs";
import { ResearchProjectExecutionHistory } from "./research-project-execution-history";
import { ResearchProjectHeader } from "./research-project-header";
import { ResearchProjectReports } from "./research-project-reports";
import { ResearchProjectRunPanel } from "./research-project-run-panel";

interface ResearchProjectDetailPageProps {
  projectId: string;
}

export function ResearchProjectDetailPage({ projectId }: ResearchProjectDetailPageProps) {
  const [activeTab, setActiveTab] = useState<ResearchProjectDetailTab>("overview");
  const runPanelRef = useRef<HTMLDivElement>(null);
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.RESEARCH_PROJECTS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.RESEARCH_PROJECTS_DELETE);
  const canExecute = hasPermission(permissions, PERMISSIONS.RESEARCH_PROJECTS_EXECUTE);

  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject,
  } = useResearchProject(projectId);

  const {
    data: reports = [],
    isLoading: isReportsLoading,
    isError: isReportsError,
    error: reportsError,
    refetch: refetchReports,
  } = useProjectResearchReports(projectId);

  const {
    data: executions = [],
    isLoading: isExecutionsLoading,
    isError: isExecutionsError,
    error: executionsError,
    refetch: refetchExecutions,
  } = useResearchExecutions(projectId);

  const scrollToRunPanel = () => {
    setActiveTab("overview");
    requestAnimationFrame(() => {
      runPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRunSuccess = () => {
    void refetchReports();
    void refetchExecutions();
  };

  if (isProjectLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <ResearchProjectDetailSkeleton />
      </div>
    );
  }

  if (isProjectError) {
    if (projectError instanceof ApiError && projectError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(projectError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <ResearchHubAccessDenied message="You do not have permission to view this research project." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <ResearchHubError
          title="Failed to load research project"
          message={getApiErrorMessage(projectError, "Could not load this project.")}
          onRetry={() => refetchProject()}
        />
      </div>
    );
  }

  if (!project) notFound();

  const reportsErrorMessage = isReportsError
    ? getApiErrorMessage(reportsError, "Could not load reports.")
    : null;

  const executionsErrorMessage = isExecutionsError
    ? getApiErrorMessage(executionsError, "Could not load execution history.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <ResearchProjectHeader
        project={project}
        actions={
          <ResearchProjectActions
            project={project}
            canWrite={canWrite}
            canDelete={canDelete}
            canExecute={canExecute}
            onRunClick={scrollToRunPanel}
          />
        }
      />

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <ResearchProjectDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          reportCount={reports.length}
          historyCount={executions.length}
        />

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div ref={runPanelRef}>
              <ResearchProjectRunPanel
                project={project}
                canExecute={canExecute}
                canWrite={canWrite}
                onRunSuccess={handleRunSuccess}
              />
            </div>
            <ResearchProjectBriefPanel project={project} canWrite={canWrite} />
          </div>
        )}

        {activeTab === "reports" && (
          <ResearchProjectReports
            projectId={projectId}
            reports={reports}
            isLoading={isReportsLoading}
            isError={isReportsError}
            errorMessage={reportsErrorMessage}
            onRetry={() => refetchReports()}
          />
        )}

        {activeTab === "history" && (
          <ResearchProjectExecutionHistory
            executions={executions}
            isLoading={isExecutionsLoading}
            isError={isExecutionsError}
            errorMessage={executionsErrorMessage}
            onRetry={() => refetchExecutions()}
          />
        )}
      </div>
    </div>
  );
}
