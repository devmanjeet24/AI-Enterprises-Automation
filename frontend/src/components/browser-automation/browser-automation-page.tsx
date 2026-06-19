"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useBrowserAnalytics,
  useBrowserProfiles,
  useBrowserTasks,
} from "@/hooks/use-browser-automation";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/browser-automation/access";
import type { BrowserTaskStatus } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserAutomationAccessDenied } from "./browser-automation-access-denied";
import { BrowserAutomationError } from "./browser-automation-error";
import { BrowserAutomationHero } from "./browser-automation-hero";
import {
  BrowserAutomationPageSkeleton,
  BrowserProfileCardSkeleton,
  BrowserTaskCardGridSkeleton,
} from "./browser-automation-skeleton";
import { BrowserAutomationStats } from "./browser-automation-stats";
import { BrowserProfileCardGrid } from "./browser-profile-card-grid";
import { BrowserProfilesEmptyState } from "./browser-profiles-empty-state";
import { BrowserTaskCardGrid } from "./browser-task-card-grid";
import { BrowserTasksEmptyState } from "./browser-tasks-empty-state";
import { CreateProfileModal } from "./create-profile-modal";
import { CreateTaskModal } from "./create-task-modal";

type TaskStatusFilter = BrowserTaskStatus | "all";
type ProfileStatusFilter = "all" | "active" | "inactive";

const taskStatusFilters: { value: TaskStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "archived", label: "Archived" },
];

const profileStatusFilters: { value: ProfileStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function BrowserAutomationPage() {
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>("all");
  const [profileStatusFilter, setProfileStatusFilter] =
    useState<ProfileStatusFilter>("all");
  const accent = dashboardAccents.blue;
  const permissions = useUserPermissions();

  const canCreateProfile = hasPermission(
    permissions,
    PERMISSIONS.BROWSER_PROFILES_WRITE,
  );
  const canCreateTask = hasPermission(permissions, PERMISSIONS.BROWSER_TASKS_WRITE);

  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    isError: isProfilesError,
    error: profilesError,
    refetch: refetchProfiles,
  } = useBrowserProfiles();

  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useBrowserTasks();

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useBrowserAnalytics();

  const filteredProfiles = useMemo(() => {
    if (profileStatusFilter === "all") return profiles;
    if (profileStatusFilter === "active") {
      return profiles.filter((profile) => profile.is_active);
    }
    return profiles.filter((profile) => !profile.is_active);
  }, [profiles, profileStatusFilter]);

  const filteredTasks = useMemo(() => {
    if (taskStatusFilter === "all") return tasks;
    return tasks.filter((task) => task.status === taskStatusFilter);
  }, [tasks, taskStatusFilter]);

  const tasksAccessDenied = isTasksError && isAccessDeniedError(tasksError);
  const profilesAccessDenied = isProfilesError && isAccessDeniedError(profilesError);
  const canReadProfiles = hasPermission(permissions, PERMISSIONS.BROWSER_PROFILES_READ);
  const canReadTasks = hasPermission(permissions, PERMISSIONS.BROWSER_TASKS_READ);
  const fullAccessDenied =
    (!canReadProfiles && !canReadTasks) ||
    (tasksAccessDenied && profilesAccessDenied);

  const analyticsErrorMessage = isAnalyticsError
    ? getApiErrorMessage(analyticsError, "Failed to load browser analytics.")
    : null;
  const profilesErrorMessage = isProfilesError
    ? getApiErrorMessage(profilesError, "Failed to load browser profiles.")
    : null;
  const tasksErrorMessage = isTasksError
    ? getApiErrorMessage(tasksError, "Failed to load browser tasks.")
    : null;

  const isInitialLoading = isLoadingProfiles && isLoadingTasks;

  if (isInitialLoading) {
    return (
      <div className="pb-10 md:pb-12">
        <BrowserAutomationPageSkeleton />
      </div>
    );
  }

  if (fullAccessDenied) {
    return (
      <div className="px-6 py-8 md:px-8">
        <BrowserAutomationAccessDenied />
      </div>
    );
  }

  const activeProfiles = profiles.filter((profile) => profile.is_active);

  return (
    <div className="pb-10 md:pb-12">
      <BrowserAutomationHero
        profiles={profiles}
        tasks={tasks}
        analytics={analytics}
        analyticsAvailable={!isAnalyticsError && Boolean(analytics)}
        canCreateProfile={canCreateProfile}
        canCreateTask={canCreateTask}
        onCreateProfileClick={() => setCreateProfileOpen(true)}
        onCreateTaskClick={() => setCreateTaskOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Portfolio"
            title="Automation overview"
            description="Track browser profiles, ready tasks, and recent execution activity across your organization."
          />
          <BrowserAutomationStats
            profiles={profiles}
            tasks={tasks}
            analytics={isAnalyticsError ? undefined : analytics}
            isLoading={isLoadingAnalytics}
            isError={isAnalyticsError}
            errorMessage={analyticsErrorMessage}
            onRetry={() => refetchAnalytics()}
          />
        </section>

        <section className="px-6 md:px-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <DashboardSectionHeader
              eyebrow="Profiles"
              title="Browser profiles"
              description="Managed browser contexts with viewport and user-agent settings for your automation tasks."
              className="mb-0"
            />
            {canCreateProfile && (
              <Button variant="secondary" size="sm" onClick={() => setCreateProfileOpen(true)}>
                Create profile
              </Button>
            )}
          </div>

          {isLoadingProfiles ? (
            <BrowserProfileCardSkeleton />
          ) : profilesAccessDenied ? (
            <BrowserAutomationAccessDenied />
          ) : isProfilesError ? (
            <BrowserAutomationError
              title="Failed to load browser profiles"
              message={profilesErrorMessage!}
              onRetry={() => refetchProfiles()}
            />
          ) : profiles.length === 0 ? (
            <BrowserProfilesEmptyState
              canCreate={canCreateProfile}
              onCreateClick={() => setCreateProfileOpen(true)}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {profileStatusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setProfileStatusFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                      profileStatusFilter === filter.value
                        ? cn(accent.bgSubtle, accent.border, accent.text)
                        : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <BrowserProfileCardGrid profiles={filteredProfiles} tasks={tasks} />
            </>
          )}
        </section>

        <section className="px-6 md:px-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <DashboardSectionHeader
              eyebrow="Tasks"
              title="Browser tasks"
              description="Define target URLs and instructions, mark tasks ready, and run them against assigned profiles."
              className="mb-0"
            />
            {canCreateTask && (
              <Button
                variant="brand"
                size="sm"
                disabled={activeProfiles.length === 0}
                onClick={() => setCreateTaskOpen(true)}
              >
                Create task
              </Button>
            )}
          </div>

          {isLoadingTasks ? (
            <BrowserTaskCardGridSkeleton />
          ) : tasksAccessDenied ? (
            <BrowserAutomationAccessDenied />
          ) : isTasksError ? (
            <BrowserAutomationError
              title="Failed to load browser tasks"
              message={tasksErrorMessage!}
              onRetry={() => refetchTasks()}
            />
          ) : tasks.length === 0 ? (
            <BrowserTasksEmptyState
              canCreate={canCreateTask}
              hasProfiles={activeProfiles.length > 0}
              onCreateClick={() => setCreateTaskOpen(true)}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {taskStatusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setTaskStatusFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                      taskStatusFilter === filter.value
                        ? cn(accent.bgSubtle, accent.border, accent.text)
                        : "border-white/[0.08] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <BrowserTaskCardGrid tasks={filteredTasks} profiles={profiles} />
            </>
          )}
        </section>
      </div>

      {canCreateProfile && (
        <CreateProfileModal
          open={createProfileOpen}
          onClose={() => setCreateProfileOpen(false)}
        />
      )}

      {canCreateTask && (
        <CreateTaskModal
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          profiles={profiles}
        />
      )}
    </div>
  );
}
