import type { AIEmployeeStatus } from "@/lib/ai-employees/types";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (status?: AIEmployeeStatus | "all") =>
    [...employeeKeys.lists(), { status: status ?? "all" }] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  conversations: (employeeId: string) =>
    [...employeeKeys.all, "conversations", employeeId] as const,
};

export const conversationKeys = {
  all: ["conversations"] as const,
  detail: (id: string) => [...conversationKeys.all, id] as const,
};

export const assignableDocumentKeys = {
  all: ["assignable-documents"] as const,
};
