import type {
  Permission,
  PermissionResourceFilter,
  PermissionStatusFilter,
} from "@/lib/permissions/types";
import { PERMISSIONS } from "@/lib/auth/permissions";

export type PermissionActionColumn = "read" | "write" | "delete" | "execute" | "other";

export type {
  CreatePermissionInput,
  Permission,
  PermissionResourceFilter,
  PermissionStatusFilter,
  UpdatePermissionInput,
} from "@/lib/permissions/types";

export const SEEDED_PERMISSION_SLUGS = new Set<string>(Object.values(PERMISSIONS));

export interface PermissionMatrixRow {
  resource: string;
  label: string;
  cells: Partial<Record<PermissionActionColumn, Permission | Permission[]>>;
}

export const PERMISSION_RESOURCE_GROUPS: { resource: string; label: string }[] = [
  { resource: "departments", label: "Departments" },
  { resource: "teams", label: "Org Teams" },
  { resource: "users", label: "Users" },
  { resource: "roles", label: "Roles" },
  { resource: "permissions", label: "Permissions" },
  { resource: "documents", label: "Documents" },
  { resource: "knowledge", label: "Knowledge" },
  { resource: "employees", label: "AI Employees" },
  { resource: "agent_teams", label: "Agent Teams" },
  { resource: "workflows", label: "Workflows" },
  { resource: "research_projects", label: "Research Hub" },
  { resource: "browser_profiles", label: "Browser Profiles" },
  { resource: "browser_tasks", label: "Browser Tasks" },
];

const RESOURCE_LABELS = Object.fromEntries(
  PERMISSION_RESOURCE_GROUPS.map(({ resource, label }) => [resource, label]),
) as Record<string, string>;

function parsePermissionAction(slug: string): { resource: string; action: string } | null {
  const separatorIndex = slug.indexOf(":");
  if (separatorIndex <= 0) return null;
  return {
    resource: slug.slice(0, separatorIndex),
    action: slug.slice(separatorIndex + 1),
  };
}

function formatResourceLabel(resource: string): string {
  return (
    RESOURCE_LABELS[resource] ??
    resource
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function mapActionToColumn(action: string): PermissionActionColumn {
  if (action === "read") return "read";
  if (action === "write") return "write";
  if (action === "delete") return "delete";
  if (action === "execute") return "execute";
  return "other";
}

export function formatPermissionAction(action: string): string {
  if (action === "assign-role") return "Assign role";
  if (action === "assign") return "Assign";
  if (action === "query") return "Query";
  if (action === "chat") return "Chat";
  return action
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function groupPermissionsByResource(permissions: Permission[]): PermissionMatrixRow[] {
  const rows = new Map<string, PermissionMatrixRow>();

  for (const permission of permissions) {
    const parsed = parsePermissionAction(permission.slug);
    if (!parsed) continue;

    const { resource, action } = parsed;
    const column = mapActionToColumn(action);

    if (!rows.has(resource)) {
      rows.set(resource, {
        resource,
        label: formatResourceLabel(resource),
        cells: {},
      });
    }

    const row = rows.get(resource)!;

    if (column === "other") {
      const existing = row.cells.other;
      row.cells.other = existing
        ? Array.isArray(existing)
          ? [...existing, permission]
          : [existing, permission]
        : [permission];
      continue;
    }

    row.cells[column] = permission;
  }

  const orderedResources = PERMISSION_RESOURCE_GROUPS.map(({ resource }) => resource);
  const extraResources = [...rows.keys()].filter((resource) => !orderedResources.includes(resource));

  return [...orderedResources, ...extraResources.sort()]
    .map((resource) => rows.get(resource))
    .filter((row): row is PermissionMatrixRow => Boolean(row));
}

export function filterMatrixRowsBySearch(
  rows: PermissionMatrixRow[],
  query: string,
): PermissionMatrixRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;

  return rows.filter((row) => {
    if (row.label.toLowerCase().includes(normalized)) return true;
    if (row.resource.toLowerCase().includes(normalized)) return true;

    return Object.values(row.cells).some((cell) => {
      const permissions = Array.isArray(cell) ? cell : cell ? [cell] : [];
      return permissions.some(
        (permission) =>
          permission.name.toLowerCase().includes(normalized) ||
          permission.slug.toLowerCase().includes(normalized),
      );
    });
  });
}

export const PERMISSION_MATRIX_COLUMNS: {
  id: PermissionActionColumn;
  label: string;
}[] = [
  { id: "read", label: "Read" },
  { id: "write", label: "Write" },
  { id: "delete", label: "Delete" },
  { id: "execute", label: "Execute" },
  { id: "other", label: "Other" },
];

export function getMatrixCellPermissions(
  cell: Permission | Permission[] | undefined,
): Permission[] {
  if (!cell) return [];
  return Array.isArray(cell) ? cell : [cell];
}

export function isPermissionGranted(
  permission: Permission,
  grantedIds: Set<string>,
): boolean {
  return grantedIds.has(permission.id);
}

export function getPermissionResource(slug: string): string | null {
  const separatorIndex = slug.indexOf(":");
  if (separatorIndex <= 0) return null;
  return slug.slice(0, separatorIndex);
}

export function getResourceLabel(resource: string): string {
  return formatResourceLabel(resource);
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

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

export function computePermissionsStats(permissions: Permission[]) {
  const active = permissions.filter((permission) => permission.is_active).length;
  const resources = new Set(
    permissions
      .map((permission) => getPermissionResource(permission.slug))
      .filter((resource): resource is string => Boolean(resource)),
  );

  return {
    total: permissions.length,
    active,
    inactive: permissions.length - active,
    resourcesCovered: resources.size,
    seeded: permissions.filter((permission) => SEEDED_PERMISSION_SLUGS.has(permission.slug))
      .length,
    custom: permissions.filter((permission) => !SEEDED_PERMISSION_SLUGS.has(permission.slug))
      .length,
  };
}

export function filterPermissionsByStatus(
  permissions: Permission[],
  filter: PermissionStatusFilter,
): Permission[] {
  if (filter === "all") return permissions;
  if (filter === "active") return permissions.filter((permission) => permission.is_active);
  return permissions.filter((permission) => !permission.is_active);
}

export function filterPermissionsByResource(
  permissions: Permission[],
  resourceFilter: PermissionResourceFilter,
): Permission[] {
  if (resourceFilter === "all") return permissions;
  return permissions.filter(
    (permission) => getPermissionResource(permission.slug) === resourceFilter,
  );
}

export function filterPermissionsBySearch(
  permissions: Permission[],
  query: string,
): Permission[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return permissions;

  return permissions.filter((permission) => {
    const resource = getPermissionResource(permission.slug);
    const resourceLabel = resource ? formatResourceLabel(resource) : "";
    return (
      permission.name.toLowerCase().includes(normalized) ||
      permission.slug.toLowerCase().includes(normalized) ||
      (permission.description?.toLowerCase().includes(normalized) ?? false) ||
      resourceLabel.toLowerCase().includes(normalized)
    );
  });
}

export function getResourceFilterOptions(permissions: Permission[]) {
  const resources = new Set<string>();
  for (const permission of permissions) {
    const resource = getPermissionResource(permission.slug);
    if (resource) resources.add(resource);
  }

  const ordered = PERMISSION_RESOURCE_GROUPS.filter(({ resource }) =>
    resources.has(resource),
  ).map(({ resource, label }) => ({ resource, label }));

  const extras = [...resources]
    .filter((resource) => !PERMISSION_RESOURCE_GROUPS.some((group) => group.resource === resource))
    .sort()
    .map((resource) => ({ resource, label: formatResourceLabel(resource) }));

  return [...ordered, ...extras];
}
