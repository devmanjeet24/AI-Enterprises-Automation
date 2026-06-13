import type { Role, RoleStatusFilter } from "@/lib/roles/types";

export const SYSTEM_ROLE_SLUGS = new Set(["admin", "manager", "member"]);

export type { CreateRoleInput, Role, RoleDetail, RoleStatusFilter, UpdateRoleInput } from "@/lib/roles/types";

export function slugifyRoleName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
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

export function getRoleInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function filterRolesByStatus(roles: Role[], filter: RoleStatusFilter): Role[] {
  if (filter === "all") return roles;
  if (filter === "active") return roles.filter((role) => role.is_active);
  if (filter === "inactive") return roles.filter((role) => !role.is_active);
  if (filter === "system") return roles.filter((role) => SYSTEM_ROLE_SLUGS.has(role.slug));
  return roles.filter((role) => !SYSTEM_ROLE_SLUGS.has(role.slug));
}

export function computeRolesStats(roles: Role[]) {
  const system = roles.filter((role) => SYSTEM_ROLE_SLUGS.has(role.slug)).length;
  const active = roles.filter((role) => role.is_active).length;

  return {
    total: roles.length,
    system,
    custom: roles.length - system,
    active,
    inactive: roles.length - active,
  };
}
