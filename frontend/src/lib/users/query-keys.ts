import type { UserStatusFilter } from "@/lib/users/types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filter?: UserStatusFilter) =>
    [...userKeys.lists(), { filter: filter ?? "all" }] as const,
  invitations: () => [...userKeys.all, "invitations"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export { roleKeys } from "@/lib/roles/query-keys";
