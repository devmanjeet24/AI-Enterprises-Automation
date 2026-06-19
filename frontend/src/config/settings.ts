import type { DashboardOverview } from "@/lib/dashboard/types";
import { PERMISSIONS } from "@/lib/auth/permissions";

export type { Organization, UpdateOrganizationInput } from "@/lib/settings/types";

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function computeSettingsStats(overview?: DashboardOverview | null) {
  return {
    totalUsers: overview?.total_users ?? null,
    totalDepartments: overview?.total_departments ?? null,
    totalTeams: overview?.total_teams ?? null,
    totalDocuments: overview?.total_documents ?? null,
    overviewAvailable: Boolean(overview),
  };
}

export const settingsNavSections = [
  {
    id: "organization",
    title: "Organization",
    description: "Company profile, slug, and workspace identity.",
    href: "/settings/organization",
    comingSoon: false,
    readPermissions: [PERMISSIONS.ORGANIZATIONS_READ],
  },
  {
    id: "users",
    title: "Users",
    description: "Human accounts, profiles, and role assignments.",
    href: "/settings/users",
    comingSoon: false,
    readPermissions: [PERMISSIONS.USERS_READ],
  },
  {
    id: "departments",
    title: "Departments",
    description: "Top-level organizational units and structure.",
    href: "/settings/departments",
    comingSoon: false,
    readPermissions: [PERMISSIONS.DEPARTMENTS_READ],
  },
  {
    id: "teams",
    title: "Org Teams",
    description: "Teams nested under departments — not Agent Teams.",
    href: "/settings/teams",
    comingSoon: false,
    readPermissions: [PERMISSIONS.TEAMS_READ],
  },
  {
    id: "roles",
    title: "Roles",
    description: "Role definitions and access bundles.",
    href: "/settings/roles",
    comingSoon: false,
    readPermissions: [PERMISSIONS.ROLES_READ],
  },
  {
    id: "permissions",
    title: "Permissions",
    description: "Permission catalog and role grants.",
    href: "/settings/permissions",
    comingSoon: false,
    readPermissions: [PERMISSIONS.PERMISSIONS_READ],
  },
] as const;
