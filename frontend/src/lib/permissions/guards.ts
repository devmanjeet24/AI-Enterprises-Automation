import { SEEDED_PERMISSION_SLUGS } from "@/config/permissions";
import type { RoleDetail } from "@/lib/roles/types";

const PERMISSION_SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validatePermissionSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase().replace(/ /g, "");
  if (!normalized) return "Slug is required.";
  if (!PERMISSION_SLUG_PATTERN.test(normalized)) {
    return "Slug must use resource:action format (for example, departments:read).";
  }
  return null;
}

export function normalizePermissionSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/ /g, "");
}

export function isSeededPermission(slug: string): boolean {
  return SEEDED_PERMISSION_SLUGS.has(slug);
}

export function getPermissionDeleteWarning(slug: string): string | null {
  if (!isSeededPermission(slug)) return null;
  return "This is a default system permission. Deleting it may affect expected access patterns.";
}

export function getLinkedRolesForPermission(
  permissionId: string,
  roleDetails: RoleDetail[],
): RoleDetail[] {
  return roleDetails.filter((role) =>
    role.permissions.some((permission) => permission.id === permissionId),
  );
}
