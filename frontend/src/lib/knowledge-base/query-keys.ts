import type { DocumentStatus } from "@/lib/knowledge-base/types";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (status?: DocumentStatus | "all") =>
    [...documentKeys.lists(), { status: status ?? "all" }] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};
