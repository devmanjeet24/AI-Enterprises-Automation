import type {
  AIEmployee,
  AIEmployeeDetail,
  EmployeeConversation,
} from "@/lib/ai-employees/types";
import type { DashboardOverview } from "@/lib/dashboard/types";

import {
  average,
  countByField,
  countInLastDays,
  countWhere,
  percentOf,
} from "./utils";

export interface AIEmployeeAnalyticsRow {
  employeeId: string;
  employeeName: string;
  role: string;
  status: AIEmployee["status"];
  knowledgeCount: number;
  enabledToolCount: number;
  conversationCount: number;
}

export interface AIEmployeeRecentConversation {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIEmployeeAnalyticsMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  employeesWithKnowledge: number;
  employeesWithTools: number;
  knowledgeCoveragePercent: number;
  toolCoveragePercent: number;
  totalConversations: number;
  conversationsLast7Days: number;
  conversationsLast30Days: number;
  avgKnowledgePerEmployee: number;
  avgToolsPerEmployee: number;
  employeesByRole: Record<string, number>;
  employeesByStatus: { active: number; inactive: number };
  employeeRows: AIEmployeeAnalyticsRow[];
  recentConversations: AIEmployeeRecentConversation[];
  insights: string[];
}

export interface AIEmployeeAnalyticsInput {
  overview?: DashboardOverview | null;
  employees?: AIEmployee[] | null;
  details?: AIEmployeeDetail[] | null;
  conversationsByEmployee?: Record<string, EmployeeConversation[]>;
}

function buildInsights(
  metrics: Omit<AIEmployeeAnalyticsMetrics, "insights">,
): string[] {
  const insights: string[] = [];

  if (metrics.totalEmployees === 0) {
    return ["Create AI employees to start tracking agent roster and utilization metrics."];
  }

  insights.push(
    `${metrics.activeEmployees} of ${metrics.totalEmployees} agents are active (${percentOf(metrics.activeEmployees, metrics.totalEmployees)}%).`,
  );

  if (metrics.employeesWithKnowledge < metrics.totalEmployees) {
    insights.push(
      `${metrics.knowledgeCoveragePercent}% of agents have assigned knowledge documents.`,
    );
  } else {
    insights.push("All agents have at least one knowledge document assigned.");
  }

  if (metrics.totalConversations > 0) {
    insights.push(
      `${metrics.totalConversations} chat conversation${metrics.totalConversations === 1 ? "" : "s"} recorded across the roster.`,
    );
  }

  if (metrics.conversationsLast7Days > 0) {
    insights.push(
      `${metrics.conversationsLast7Days} new conversation${metrics.conversationsLast7Days === 1 ? "" : "s"} started in the last 7 days.`,
    );
  } else if (metrics.inactiveEmployees > 0) {
    insights.push(
      `${metrics.inactiveEmployees} inactive agent${metrics.inactiveEmployees === 1 ? "" : "s"} may be candidates for decommissioning.`,
    );
  }

  return insights.slice(0, 4);
}

export function computeAIEmployeeMetrics(
  input: AIEmployeeAnalyticsInput,
): AIEmployeeAnalyticsMetrics | null {
  const overview = input.overview;
  if (!overview) return null;

  const employees = input.employees ?? [];
  const details = input.details ?? [];
  const conversationsByEmployee = input.conversationsByEmployee ?? {};

  const detailById = new Map(details.map((detail) => [detail.id, detail]));

  const activeEmployees = countWhere(employees, (employee) => employee.status === "active");
  const inactiveEmployees = employees.length - activeEmployees;

  const knowledgeCounts = employees.map((employee) => {
    const detail = detailById.get(employee.id);
    return detail?.document_assignments.length ?? 0;
  });
  const toolCounts = employees.map((employee) => {
    const detail = detailById.get(employee.id);
    return detail?.tools.filter((tool) => tool.is_enabled).length ?? 0;
  });

  const employeesWithKnowledge = knowledgeCounts.filter((count) => count > 0).length;
  const employeesWithTools = toolCounts.filter((count) => count > 0).length;

  const allConversations = Object.entries(conversationsByEmployee).flatMap(
    ([employeeId, conversations]) => {
      const employee = employees.find((item) => item.id === employeeId);
      return conversations.map((conversation) => ({
        ...conversation,
        employeeName: employee?.name ?? "Unknown agent",
      }));
    },
  );

  const employeeRows: AIEmployeeAnalyticsRow[] = employees
    .map((employee) => {
      const detail = detailById.get(employee.id);
      const conversations = conversationsByEmployee[employee.id] ?? [];
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        status: employee.status,
        knowledgeCount: detail?.document_assignments.length ?? 0,
        enabledToolCount: detail?.tools.filter((tool) => tool.is_enabled).length ?? 0,
        conversationCount: conversations.length,
      };
    })
    .sort((left, right) => right.conversationCount - left.conversationCount);

  const recentConversations: AIEmployeeRecentConversation[] = [...allConversations]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, 8)
    .map((conversation) => ({
      id: conversation.id,
      employeeId: conversation.ai_employee_id,
      employeeName: conversation.employeeName,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    }));

  const baseMetrics = {
    totalEmployees: employees.length || overview.total_ai_employees,
    activeEmployees,
    inactiveEmployees,
    employeesWithKnowledge,
    employeesWithTools,
    knowledgeCoveragePercent: percentOf(employeesWithKnowledge, employees.length),
    toolCoveragePercent: percentOf(employeesWithTools, employees.length),
    totalConversations: allConversations.length,
    conversationsLast7Days: countInLastDays(allConversations, 7),
    conversationsLast30Days: countInLastDays(allConversations, 30),
    avgKnowledgePerEmployee: average(knowledgeCounts) ?? 0,
    avgToolsPerEmployee: average(toolCounts) ?? 0,
    employeesByRole: countByField(employees, (employee) => employee.role),
    employeesByStatus: { active: activeEmployees, inactive: inactiveEmployees },
    employeeRows,
    recentConversations,
  };

  return {
    ...baseMetrics,
    insights: buildInsights(baseMetrics),
  };
}
