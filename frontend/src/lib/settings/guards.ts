import type { User } from "@/store/slices/auth-slice";

export function isOrganizationAdmin(user: User | null | undefined): boolean {
  return user?.roles.some((role) => role.slug === "admin") ?? false;
}
