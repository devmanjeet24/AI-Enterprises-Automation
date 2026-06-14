"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployee, listEmployeeConversations, listEmployees } from "@/lib/api/employees";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { computeAIEmployeeMetrics } from "@/lib/analytics/compute/ai-employees";
import { fetchOptional } from "@/lib/analytics/fetch-optional";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { AIEmployeeAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useAIEmployeesAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.aiEmployees(),
    queryFn: async (): Promise<AIEmployeeAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      const employeesResult = await fetchOptional(() => listEmployees(token!));
      const employeesAccessDenied = employeesResult.accessDenied;
      const employees = employeesResult.data ?? [];

      let detailsAccessDenied = false;
      let conversationsAccessDenied = false;
      const details: AIEmployeeAnalyticsSnapshot["details"] = [];
      const conversationsByEmployee: AIEmployeeAnalyticsSnapshot["conversationsByEmployee"] =
        {};

      if (!employeesAccessDenied && employees.length > 0) {
        const [detailResults, conversationResults] = await Promise.all([
          Promise.all(
            employees.map((employee) =>
              fetchOptional(() => getEmployee(token!, employee.id)),
            ),
          ),
          Promise.all(
            employees.map((employee) =>
              fetchOptional(() => listEmployeeConversations(token!, employee.id)),
            ),
          ),
        ]);

        detailsAccessDenied = detailResults.some((result) => result.accessDenied);
        conversationsAccessDenied = conversationResults.some(
          (result) => result.accessDenied,
        );

        detailResults.forEach((result) => {
          if (result.data) details.push(result.data);
        });

        employees.forEach((employee, index) => {
          if (conversationResults[index]?.data) {
            conversationsByEmployee[employee.id] = conversationResults[index].data!;
          }
        });
      }

      const hasPartialAccess =
        !employeesAccessDenied ||
        !detailsAccessDenied ||
        !conversationsAccessDenied;

      const metrics = computeAIEmployeeMetrics({
        overview,
        employees: employeesResult.data,
        details,
        conversationsByEmployee,
      });

      return {
        overview,
        employees: employeesResult.data,
        details,
        conversationsByEmployee,
        metrics,
        employeesAccessDenied,
        detailsAccessDenied,
        conversationsAccessDenied,
        hasPartialAccess,
      };
    },
    enabled: Boolean(token),
  });
}
