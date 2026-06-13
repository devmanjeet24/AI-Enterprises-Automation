import type { User } from "@/lib/users/types";

const ADMIN_ROLE_SLUG = "admin";

export function userHasAdminRole(user: User): boolean {
  return user.roles.some((role) => role.slug === ADMIN_ROLE_SLUG);
}

export function countActiveAdmins(users: User[]): number {
  return users.filter((user) => user.is_active && userHasAdminRole(user)).length;
}

export function isLastActiveAdmin(user: User, allUsers: User[]): boolean {
  if (!user.is_active || !userHasAdminRole(user)) return false;
  return countActiveAdmins(allUsers) <= 1;
}

export function wouldLoseAdminRole(
  user: User,
  roleIdToRemove: string,
  allUsers: User[],
): boolean {
  const roleToRemove = user.roles.find((role) => role.id === roleIdToRemove);
  if (!roleToRemove || roleToRemove.slug !== ADMIN_ROLE_SLUG) return false;
  if (!user.is_active) return false;

  const remainingAdminRoles = user.roles.filter(
    (role) => role.slug === ADMIN_ROLE_SLUG && role.id !== roleIdToRemove,
  );
  if (remainingAdminRoles.length > 0) return false;

  return countActiveAdmins(allUsers) <= 1;
}

export function isSelfUser(userId: string, currentUserId: string | undefined): boolean {
  return Boolean(currentUserId) && userId === currentUserId;
}

export function getDeactivateBlockedMessage(
  user: User,
  allUsers: User[],
  currentUserId: string | undefined,
): string | null {
  if (isSelfUser(user.id, currentUserId)) {
    return "You cannot deactivate your own account.";
  }
  if (isLastActiveAdmin(user, allUsers)) {
    return "Cannot deactivate the last active administrator.";
  }
  return null;
}

export function getRemoveRoleBlockedMessage(
  user: User,
  roleId: string,
  allUsers: User[],
): string | null {
  if (wouldLoseAdminRole(user, roleId, allUsers)) {
    return "Cannot remove the last active administrator role.";
  }
  return null;
}
