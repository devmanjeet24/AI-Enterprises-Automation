"use client";

import { notFound } from "next/navigation";

import {
  useBrowserProfile,
  useBrowserTasks,
} from "@/hooks/use-browser-automation";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/browser-automation/access";

import { BrowserAutomationAccessDenied } from "./browser-automation-access-denied";
import { BrowserAutomationError } from "./browser-automation-error";
import { BrowserProfileDetailSkeleton } from "./browser-automation-skeleton";
import { BrowserProfileActions } from "./browser-profile-actions";
import { BrowserProfileConfigPanel } from "./browser-profile-config-panel";
import { BrowserProfileSessionPanel } from "./browser-profile-session-panel";
import { BrowserProfileHeader } from "./browser-profile-header";
import { BrowserProfileLinkedTasks } from "./browser-profile-linked-tasks";

interface BrowserProfileDetailPageProps {
  profileId: string;
}

export function BrowserProfileDetailPage({ profileId }: BrowserProfileDetailPageProps) {
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.BROWSER_PROFILES_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.BROWSER_PROFILES_DELETE);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useBrowserProfile(profileId);

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useBrowserTasks(profileId);

  if (isProfileLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <BrowserProfileDetailSkeleton />
      </div>
    );
  }

  if (isProfileError) {
    if (profileError instanceof ApiError && profileError.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(profileError)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <BrowserAutomationAccessDenied message="You do not have permission to view this browser profile." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <BrowserAutomationError
          title="Failed to load browser profile"
          message={getApiErrorMessage(profileError, "Could not load this profile.")}
          onRetry={() => refetchProfile()}
        />
      </div>
    );
  }

  if (!profile) notFound();

  const tasksErrorMessage = isTasksError
    ? getApiErrorMessage(tasksError, "Could not load linked tasks.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <BrowserProfileHeader
        profile={profile}
        actions={
          <BrowserProfileActions
            profile={profile}
            canWrite={canWrite}
            canDelete={canDelete}
          />
        }
      />

      <div className="mt-8 space-y-8 px-6 md:mt-10 md:px-8">
        <BrowserProfileConfigPanel profile={profile} canWrite={canWrite} />
        <BrowserProfileSessionPanel profile={profile} canWrite={canWrite} />

        <div>
          <div className="mb-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Linked tasks
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Browser tasks assigned to this profile.
            </p>
          </div>
          <BrowserProfileLinkedTasks
            tasks={tasks}
            isLoading={isTasksLoading}
            isError={isTasksError}
            errorMessage={tasksErrorMessage}
            onRetry={() => refetchTasks()}
          />
        </div>
      </div>
    </div>
  );
}
