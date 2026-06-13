import type { User, UserStatusFilter } from "@/lib/users/types";

export type { AssignRoleInput, Role, UpdateUserInput, User } from "@/lib/users/types";

export function getUserDisplayName(user: Pick<User, "first_name" | "last_name" | "email">): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function getUserInitials(user: Pick<User, "first_name" | "last_name" | "email">): string {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials.slice(0, 2);
  return user.email.slice(0, 2).toUpperCase();
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

export function filterUsersByStatus(users: User[], filter: UserStatusFilter): User[] {
  if (filter === "all") return users;
  if (filter === "active") return users.filter((user) => user.is_active);
  return users.filter((user) => !user.is_active);
}

export function computeUsersStats(users: User[]) {
  const active = users.filter((user) => user.is_active).length;
  const inactive = users.length - active;
  const admins = users.filter(
    (user) => user.is_active && user.roles.some((role) => role.slug === "admin"),
  ).length;

  return {
    total: users.length,
    active,
    inactive,
    admins,
  };
}
