"use client";

import { DashboardSectionHeader } from "../dashboard-card";
import { useOverviewPage } from "@/hooks/use-dashboard-overview";

import { OverviewAiEmployees } from "./overview-ai-employees";
import { OverviewHero } from "./overview-hero";
import { OverviewKpiGrid } from "./overview-kpi-grid";
import { OverviewPlatformPulse } from "./overview-platform-pulse";
import { OverviewRecentActivity } from "./overview-recent-activity";
import { OverviewWorkflowSummary } from "./overview-workflow-summary";
import { FeaturedVideoCard } from "./featured-video-card";

export function OverviewPage() {
  const data = useOverviewPage();

  return (
    <div className="pb-10 md:pb-12">
      <OverviewHero data={data} />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <OverviewKpiGrid kpis={data.kpis} isLoading={data.isLoading} />

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Operations"
            title="Activity & agents"
            description="Live feed, platform health, and agent status across your workspace."
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
            <div className="lg:col-span-5">
              <OverviewRecentActivity
                activity={data.activity}
                activityTodayCount={data.activityTodayCount}
                isLoading={data.isLoading}
              />
            </div>

            <div className="flex flex-col gap-5 lg:col-span-3 lg:gap-6">
              <FeaturedVideoCard className="flex-1" />
              <OverviewPlatformPulse
                metrics={data.platformPulse}
                isLoading={data.isLoading}
              />
            </div>

            <div className="lg:col-span-4">
              <OverviewAiEmployees
                employees={data.employees}
                activeCount={data.activeEmployeeCount}
                totalCount={data.overview?.total_ai_employees ?? 0}
                isLoading={data.isLoading}
              />
            </div>
          </div>
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Automation"
            title="Workflow summary"
            description="Active pipelines and scheduled jobs across your organization."
          />
          <OverviewWorkflowSummary
            workflows={data.workflows}
            runningCount={data.runningWorkflowCount}
            isLoading={data.isLoading}
          />
        </section>
      </div>
    </div>
  );
}
