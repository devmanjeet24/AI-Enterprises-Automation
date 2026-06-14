"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardOverview } from "@/lib/api/dashboard";
import { listDocuments } from "@/lib/api/documents";
import { isAnalyticsAccessDeniedError } from "@/lib/analytics/access";
import { computeKnowledgeMetrics } from "@/lib/analytics/compute/knowledge";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { KnowledgeAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useKnowledgeAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.knowledge(),
    queryFn: async (): Promise<KnowledgeAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      try {
        const documents = await listDocuments(token!);
        const metrics = computeKnowledgeMetrics(documents, overview);

        return {
          overview,
          documents,
          metrics,
          accessDenied: false,
        };
      } catch (error) {
        if (isAnalyticsAccessDeniedError(error)) {
          return {
            overview,
            documents: undefined,
            metrics: null,
          accessDenied: true,
        };
        }
        throw error;
      }
    },
    enabled: Boolean(token),
  });
}
