import { apiClient } from "@/lib/api/client";
import type { DashboardOverview } from "@/lib/dashboard/types";

const DASHBOARD_BASE = "/api/v1/dashboard";

export function getDashboardOverview(token: string): Promise<DashboardOverview> {
  return apiClient<DashboardOverview>(`${DASHBOARD_BASE}/overview`, {
    method: "GET",
    token,
  });
}
