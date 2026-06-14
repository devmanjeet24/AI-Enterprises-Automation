"use client";

import { useQuery } from "@tanstack/react-query";

import { listDepartments } from "@/lib/api/departments";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { listDocuments } from "@/lib/api/documents";
import { getOrganization } from "@/lib/api/organizations";
import { listPermissions } from "@/lib/api/permissions";
import { listRoles } from "@/lib/api/roles";
import { listTeams } from "@/lib/api/teams";
import { listUsers } from "@/lib/api/users";
import { fetchOptional } from "@/lib/analytics/fetch-optional";
import { computeOrganizationMetrics } from "@/lib/analytics/compute/organization";
import { analyticsKeys } from "@/lib/analytics/query-keys";
import type { OrganizationAnalyticsSnapshot } from "@/lib/analytics/types";

import { useAuthToken } from "./use-auth-token";

export function useOrganizationAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: analyticsKeys.organization(),
    queryFn: async (): Promise<OrganizationAnalyticsSnapshot> => {
      const overview = await getDashboardOverview(token!);

      const [
        organizationResult,
        usersResult,
        departmentsResult,
        teamsResult,
        rolesResult,
        permissionsResult,
      ] = await Promise.all([
        fetchOptional(() => getOrganization(token!)),
        fetchOptional(() => listUsers(token!)),
        fetchOptional(() => listDepartments(token!)),
        fetchOptional(() => listTeams(token!)),
        fetchOptional(() => listRoles(token!)),
        fetchOptional(() => listPermissions(token!)),
      ]);

      const usersAccessDenied = usersResult.accessDenied;
      const departmentsAccessDenied = departmentsResult.accessDenied;
      const teamsAccessDenied = teamsResult.accessDenied;
      const rolesAccessDenied = rolesResult.accessDenied;
      const permissionsAccessDenied = permissionsResult.accessDenied;

      const hasPartialAccess =
        !usersAccessDenied ||
        !departmentsAccessDenied ||
        !teamsAccessDenied ||
        !rolesAccessDenied ||
        !permissionsAccessDenied;

      const metrics = computeOrganizationMetrics({
        overview,
        users: usersResult.data,
        departments: departmentsResult.data,
        teams: teamsResult.data,
        roles: rolesResult.data,
        permissions: permissionsResult.data,
      });

      return {
        overview,
        organization: organizationResult.data,
        users: usersResult.data,
        departments: departmentsResult.data,
        teams: teamsResult.data,
        roles: rolesResult.data,
        permissions: permissionsResult.data,
        metrics,
        usersAccessDenied,
        departmentsAccessDenied,
        teamsAccessDenied,
        rolesAccessDenied,
        permissionsAccessDenied,
        hasPartialAccess,
      };
    },
    enabled: Boolean(token),
  });
}
