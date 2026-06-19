import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";

/** Returns true when the user holds at least one of the given permission slugs. */
export function hasAnyPermission(
  permissions: string[] | undefined,
  slugs: readonly string[],
): boolean {
  return slugs.some((slug) => hasPermission(permissions, slug));
}

export interface PermissionNavItem {
  readPermissions?: readonly string[];
}

/** Filter nav items to those the user may see (no slugs = always visible). */
export function filterNavByPermissions<T extends PermissionNavItem>(
  items: readonly T[],
  userPermissions: string[] | undefined,
): T[] {
  return items.filter((item) => {
    if (!item.readPermissions || item.readPermissions.length === 0) {
      return true;
    }
    return hasAnyPermission(userPermissions, item.readPermissions);
  });
}

export const SETTINGS_READ_PERMISSIONS = [
  PERMISSIONS.ORGANIZATIONS_READ,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.DEPARTMENTS_READ,
  PERMISSIONS.TEAMS_READ,
  PERMISSIONS.ROLES_READ,
  PERMISSIONS.PERMISSIONS_READ,
] as const;

export function canAccessSettings(userPermissions: string[] | undefined): boolean {
  return hasAnyPermission(userPermissions, SETTINGS_READ_PERMISSIONS);
}
