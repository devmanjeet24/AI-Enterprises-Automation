"use client";

import { buildOmnichannelHeroStats } from "@/config/omnichannel";
import { useOmnichannelAnalytics } from "@/hooks/use-omnichannel";
import { getApiErrorMessage } from "@/lib/api/errors";
import { isAnalyticsAccessDeniedError } from "@/lib/analytics/access";
import { dashboardAccents } from "@/lib/dashboard-accents";

import { AnalyticsAccessDenied } from "./analytics-access-denied";
import { AnalyticsHero } from "./analytics-hero";
import { AnalyticsLayout } from "./analytics-layout";
import { OmnichannelAnalyticsDashboard } from "./omnichannel-analytics-dashboard";
import { AnalyticsPageSkeleton } from "./analytics-skeleton";
import { AnalyticsSubNav } from "./analytics-sub-nav";

export function AnalyticsOmnichannelPage() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useOmnichannelAnalytics();

  const accessDenied = isError && isAnalyticsAccessDeniedError(error);
  const errorMessage =
    isError && !accessDenied
      ? getApiErrorMessage(error, "Could not load omnichannel analytics.")
      : null;

  if (isLoading && !analytics) {
    return <AnalyticsPageSkeleton />;
  }

  const heroStats = buildOmnichannelHeroStats(analytics);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        eyebrow="Analytics · Omnichannel"
        title={
          <>
            Omnichannel{" "}
            <span className={dashboardAccents.purple.text}>analytics</span>
          </>
        }
        description="Conversation volume, channel mix, message roles, AI vs human handling, and handoff activity."
        stats={heroStats}
        isLoading={isLoading}
      />
      <AnalyticsSubNav />

      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        {accessDenied ? (
          <AnalyticsAccessDenied
            title="Omnichannel analytics unavailable"
            message="You need omnichannel channel read permission to view these metrics."
          />
        ) : (
          <OmnichannelAnalyticsDashboard
            analytics={analytics}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            onRetry={() => void refetch()}
            showHeader={false}
          />
        )}
      </div>
    </AnalyticsLayout>
  );
}
