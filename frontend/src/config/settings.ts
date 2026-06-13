import type { DashboardOverview } from "@/lib/dashboard/types";

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
  },
  {
    id: "users",
    title: "Users",
    description: "Human accounts, profiles, and role assignments.",
    href: "/settings/users",
    comingSoon: false,
  },
  {
    id: "departments",
    title: "Departments",
    description: "Top-level organizational units and structure.",
    href: "/settings/departments",
    comingSoon: false,
  },
  {
    id: "teams",
    title: "Org Teams",
    description: "Teams nested under departments — not Agent Teams.",
    href: "/settings/teams",
    comingSoon: false,
  },
  {
    id: "roles",
    title: "Roles",
    description: "Role definitions and access bundles.",
    href: "/settings/roles",
    comingSoon: false,
  },
  {
    id: "permissions",
    title: "Permissions",
    description: "Permission catalog and role grants.",
    href: "/settings/permissions",
    comingSoon: false,
  },
] as const;
