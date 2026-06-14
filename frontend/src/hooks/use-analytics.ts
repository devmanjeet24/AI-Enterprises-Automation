"use client";

import { useQuery } from "@tanstack/react-query";

import { getBrowserAnalytics } from "@/lib/api/browser-tasks";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { getResearchAnalytics } from "@/lib/api/research-projects";
import { isAnalyticsAccessDeniedError } from "@/lib/analytics/access";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { ExecutiveAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useExecutiveAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.executive(),
    queryFn: async (): Promise<ExecutiveAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      let research;
      let browser;
      let researchAccessDenied = false;
      let browserAccessDenied = false;

      try {
        research = await getResearchAnalytics(token!);
      } catch (error) {
        if (isAnalyticsAccessDeniedError(error)) {
          researchAccessDenied = true;
        }
      }

      try {
        browser = await getBrowserAnalytics(token!);
      } catch (error) {
        if (isAnalyticsAccessDeniedError(error)) {
          browserAccessDenied = true;
        }
      }

      return {
        overview,
        research,
        browser,
        researchAccessDenied,
        browserAccessDenied,
        researchAvailable: Boolean(research),
        browserAvailable: Boolean(browser),
      };
    },
    enabled: Boolean(token),
  });
}

export { useDashboardOverview } from "./use-dashboard-overview";
export { useKnowledgeAnalytics } from "./use-knowledge-analytics";
export { useOrganizationAnalytics } from "./use-organization-analytics";
export { useAgentTeamsAnalytics } from "./use-agent-teams-analytics";
export { useWorkflowsAnalytics } from "./use-workflows-analytics";
export { useAIEmployeesAnalytics } from "./use-ai-employees-analytics";
export { useReportsAnalytics } from "./use-reports-analytics";
export { useResearchAnalytics } from "./use-research-projects";
export { useBrowserAnalytics } from "./use-browser-automation";
