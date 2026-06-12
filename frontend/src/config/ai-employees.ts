import type {
  AIEmployee,
  AIEmployeeDetail,
  AIEmployeeStatus,
  ToolDefinition,
} from "@/lib/ai-employees/types";

export type {
  AIEmployee,
  AIEmployeeDetail,
  AIEmployeeStatus,
  AIEmployeeDocumentAssignment,
  AIEmployeeToolAssignment,
  ChatMessage,
  EmployeeConversation,
  EmployeeConversationDetail,
  ToolDefinition,
} from "@/lib/ai-employees/types";

export const employeeStatusLabels: Record<AIEmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const toolCatalog: ToolDefinition[] = [
  {
    slug: "knowledge_search",
    name: "Knowledge Search",
    description: "Search assigned knowledge documents for relevant context",
  },
  {
    slug: "calculator",
    name: "Calculator",
    description: "Perform basic arithmetic calculations",
  },
];

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Answer questions using only the knowledge documents assigned to you. Be concise and professional.";

export function getEmployeeInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export function computeEmployeeStats(
  employees: AIEmployee[],
  details?: AIEmployeeDetail[],
) {
  const detailById = new Map(details?.map((d) => [d.id, d]) ?? []);

  const withKnowledge = employees.filter((employee) => {
    const detail = detailById.get(employee.id);
    if (detail) return detail.document_assignments.length > 0;
    return false;
  }).length;

  return {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    withKnowledge,
  };
}

export function isEmployeeDetail(
  employee: AIEmployee | AIEmployeeDetail,
): employee is AIEmployeeDetail {
  return "document_assignments" in employee;
}
