"use client";

import { notFound } from "next/navigation";
import { useRef, useState } from "react";

import {
  useBrowserTask,
  useBrowserTaskExecutions,
} from "@/hooks/use-browser-automation";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/browser-automation/access";

import { BrowserAutomationAccessDenied } from "./browser-automation-access-denied";
import { BrowserAutomationError } from "./browser-automation-error";
import { BrowserTaskDetailSkeleton } from "./browser-automation-skeleton";
import { BrowserTaskActions } from "./browser-task-actions";
import { BrowserTaskConfigPanel } from "./browser-task-config-panel";
import {
  BrowserTaskDetailTabs,
  type BrowserTaskDetailTab,
} from "./browser-task-detail-tabs";
import { BrowserTaskExecutionHistory } from "./browser-task-execution-history";
import { BrowserTaskHeader } from "./browser-task-header";
import { BrowserTaskRunPanel } from "./browser-task-run-panel";

interface BrowserTaskDetailPageProps {
  taskId: string;
}

export function BrowserTaskDetailPage({ taskId }: BrowserTaskDetailPageProps) {
  const [activeTab, setActiveTab] = useState<BrowserTaskDetailTab>("overview");
  const runPanelRef = useRef<HTMLDivElement>(null);
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.BROWSER_TASKS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.BROWSER_TASKS_DELETE);
  const canExecute = hasPermission(permissions, PERMISSIONS.BROWSER_TASKS_EXECUTE);

  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
    error: taskError,
    refetch: refetchTask,
  } = useBrowserTask(taskId);

  const {
    data: executions = [],
    isLoading: isExecutionsLoading,
    isError: isExecutionsError,
    error: executionsError,
    refetch: refetchExecutions,
  } = useBrowserTaskExecutions(taskId);

  const scrollToRunPanel = () => {
    setActiveTab("overview");
    requestAnimationFrame(() => {
      runPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRunSuccess = () => {
    void refetchExecutions();
    void refetchTask();
  };

  if (isTaskLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <BrowserTaskDetailSkeleton />
      </div>
    );
  }

  if (isTaskError) {
    if (taskError instanceof ApiError && taskError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(taskError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <BrowserAutomationAccessDenied message="You do not have permission to view this browser task." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <BrowserAutomationError
          title="Failed to load browser task"
          message={getApiErrorMessage(taskError, "Could not load this task.")}
          onRetry={() => refetchTask()}
        />
      </div>
    );
  }

  if (!task) notFound();

  const executionsErrorMessage = isExecutionsError
    ? getApiErrorMessage(executionsError, "Could not load execution history.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <BrowserTaskHeader
        task={task}
        actions={
          <BrowserTaskActions
            task={task}
            canWrite={canWrite}
            canDelete={canDelete}
            canExecute={canExecute}
            onRunClick={scrollToRunPanel}
          />
        }
      />

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <BrowserTaskDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          historyCount={executions.length}
        />

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div ref={runPanelRef}>
              <BrowserTaskRunPanel
                task={task}
                canExecute={canExecute}
                canWrite={canWrite}
                onRunSuccess={handleRunSuccess}
              />
            </div>
            <BrowserTaskConfigPanel task={task} canWrite={canWrite} />
          </div>
        )}

        {activeTab === "history" && (
          <BrowserTaskExecutionHistory
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
