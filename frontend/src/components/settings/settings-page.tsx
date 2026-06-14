"use client";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import { useAuthUser } from "@/hooks/use-auth-token";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";
import { getApiErrorMessage } from "@/lib/api/errors";

import { SettingsHero } from "./settings-hero";
import { SettingsNavGrid } from "./settings-nav-grid";
import { SettingsPageSkeleton } from "./settings-skeleton";
import { SettingsStats } from "./settings-stats";
import { SettingsAccessDenied } from "./settings-access-denied";
import { isAccessDeniedError } from "@/lib/settings/access";

export function SettingsPage() {
  const user = useAuthUser();

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview();

  const organizationName = user?.organization_name ?? "your organization";
  const isInitialLoading = isOverviewLoading && !overview;
  const accessDenied = isOverviewError && isAccessDeniedError(overviewError);

  if (accessDenied) {
    return (
      <div className="px-6 py-16 md:px-8">
        <SettingsAccessDenied message="You do not have permission to view workspace settings." />
      </div>
    );
  }

  if (isInitialLoading) {
    return <SettingsPageSkeleton />;
  }

  const overviewErrorMessage = isOverviewError
    ? getApiErrorMessage(overviewError, "Could not load workspace metrics.")
    : null;

  return (
    <div className="pb-10 md:pb-12">
      <SettingsHero
        organizationName={organizationName}
        overview={overview}
        isLoading={isOverviewLoading}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Workspace"
            title="Organization overview"
            description="High-level counts for users, structure, and knowledge assets in your tenant."
          />
          <SettingsStats
            overview={overview}
            isLoading={isOverviewLoading}
            isError={isOverviewError}
            errorMessage={overviewErrorMessage}
            onRetry={() => refetchOverview()}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Administration"
            title="Settings sections"
            description="Manage organization profile today. Additional administration modules arrive in upcoming phases."
          />
          <SettingsNavGrid />
        </section>
      </div>
    </div>
  );
}
