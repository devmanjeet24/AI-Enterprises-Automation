import { SYSTEM_ROLE_SLUGS } from "@/config/roles";
import type { Role } from "@/lib/roles/types";
import type { User } from "@/lib/users/types";

export function isSystemRole(slug: string): boolean {
  return SYSTEM_ROLE_SLUGS.has(slug);
}

export function isRoleSlugLocked(role: Role): boolean {
  return isSystemRole(role.slug);
}

export function isRoleDeactivationBlocked(role: Role): boolean {
  return isSystemRole(role.slug);
}

export function isRoleDeleteBlocked(role: Role): boolean {
  return isSystemRole(role.slug);
}

export function countUsersWithRole(roleId: string, users: User[]): number {
  return users.filter((user) => user.roles.some((role) => role.id === roleId)).length;
}

export function getRoleDeleteBlockedMessage(role: Role, users: User[]): string | null {
  if (isRoleDeleteBlocked(role)) {
    return "System roles cannot be deleted.";
  }

  const assignedCount = countUsersWithRole(role.id, users);
  if (assignedCount === 0) return null;

  const label = assignedCount === 1 ? "user" : "users";
  return `Cannot delete: ${assignedCount} ${label} still have this role assigned. Remove assignments first.`;
}

export function getRoleSlugLockedMessage(role: Role): string | null {
  if (!isRoleSlugLocked(role)) return null;
  return "System role slugs cannot be changed.";
}
