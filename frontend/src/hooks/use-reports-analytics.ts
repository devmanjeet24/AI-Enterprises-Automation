"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardOverview } from "@/lib/api/dashboard";
import {
  getResearchAnalytics,
  listResearchProjects,
  listResearchReports,
} from "@/lib/api/research-projects";
import { computeReportsMetrics } from "@/lib/analytics/compute/reports";
import { fetchOptional } from "@/lib/analytics/fetch-optional";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { ReportsAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

const REPORTS_LIST_LIMIT = 100;

export function useReportsAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.reports(),
    queryFn: async (): Promise<ReportsAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      const [reportsResult, projectsResult, analyticsResult] = await Promise.all([
        fetchOptional(() =>
          listResearchReports(token!, { limit: REPORTS_LIST_LIMIT }),
        ),
        fetchOptional(() => listResearchProjects(token!)),
        fetchOptional(() => getResearchAnalytics(token!)),
      ]);

      const reportsAccessDenied = reportsResult.accessDenied;
      const projectsAccessDenied = projectsResult.accessDenied;
      const researchAnalyticsAccessDenied = analyticsResult.accessDenied;

      const hasPartialAccess =
        !reportsAccessDenied ||
        !projectsAccessDenied ||
        !researchAnalyticsAccessDenied;

      const metrics = computeReportsMetrics({
        overview,
        reports: reportsResult.data,
        projects: projectsResult.data,
        researchAnalytics: analyticsResult.data,
      });

      return {
        overview,
        reports: reportsResult.data,
        projects: projectsResult.data,
        researchAnalytics: analyticsResult.data,
        metrics,
        reportsAccessDenied,
        projectsAccessDenied,
        researchAnalyticsAccessDenied,
        hasPartialAccess,
      };
    },
    enabled: Boolean(token),
  });
}
