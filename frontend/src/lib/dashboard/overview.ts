import type { AgentTask } from "@/lib/agent-teams/types";
import type { AIEmployee } from "@/lib/ai-employees/types";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import type {
  Workflow,
  WorkflowExecution,
} from "@/lib/workflows/types";

import type {
  DashboardOverview,
  OverviewActivityItem,
  OverviewEmployeeItem,
  OverviewKpiItem,
  OverviewPlatformMetric,
  OverviewQuickStat,
  OverviewWorkflowDisplayStatus,
  OverviewWorkflowItem,
} from "./types";

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "Just now";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export const overviewKpiPlaceholders: OverviewKpiItem[] = [
  { label: "Users", value: "—", change: "Organization members", trend: "neutral", accent: "blue" },
  { label: "Documents", value: "—", change: "Knowledge base", trend: "neutral", accent: "purple" },
  { label: "AI Employees", value: "—", change: "Configured agents", trend: "neutral", accent: "emerald" },
  { label: "Agent Tasks", value: "—", change: "Team executions", trend: "neutral", accent: "blue" },
  { label: "Workflows", value: "—", change: "Automation pipelines", trend: "neutral", accent: "purple" },
  { label: "Research Projects", value: "—", change: "Research hub", trend: "neutral", accent: "gold" },
  { label: "Browser Tasks", value: "—", change: "Browser automation", trend: "neutral", accent: "gold" },
];

export function buildOverviewKpis(overview: DashboardOverview): OverviewKpiItem[] {
  return [
    {
      label: "Users",
      value: formatCount(overview.total_users),
      change: "Organization members",
      trend: "neutral",
      accent: "blue",
    },
    {
      label: "Documents",
      value: formatCount(overview.total_documents),
      change: "Knowledge base",
      trend: "neutral",
      accent: "purple",
    },
    {
      label: "AI Employees",
      value: formatCount(overview.total_ai_employees),
      change: "Configured agents",
      trend: "neutral",
      accent: "emerald",
    },
    {
      label: "Agent Tasks",
      value: formatCount(overview.total_agent_tasks),
      change: "Team executions",
      trend: "neutral",
      accent: "blue",
    },
    {
      label: "Workflows",
      value: formatCount(overview.total_workflows),
      change: "Automation pipelines",
      trend: "neutral",
      accent: "purple",
    },
    {
      label: "Research Projects",
      value: formatCount(overview.total_research_projects),
      change: "Research hub",
      trend: "neutral",
      accent: "gold",
    },
    {
      label: "Browser Tasks",
      value: formatCount(overview.total_browser_tasks),
      change: "Browser automation",
      trend: "neutral",
      accent: "gold",
    },
  ];
}

export function buildOverviewQuickStats(
  overview: DashboardOverview,
  employees: AIEmployee[],
  documents: KnowledgeDocument[],
  tasks: AgentTask[],
  executions: WorkflowExecution[],
): OverviewQuickStat[] {
  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;
  const readyDocuments = documents.filter(
    (document) => document.status === "ready",
  ).length;
  const completedAgentTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const completedExecutions = executions.filter(
    (execution) => execution.status === "completed",
  ).length;

  return [
    {
      label: "Active agents",
      value: percent(activeEmployees, overview.total_ai_employees),
      accent: "emerald",
    },
    {
      label: "Tasks completed",
      value: percent(completedAgentTasks, overview.total_agent_tasks),
      accent: "blue",
    },
    {
      label: "Knowledge coverage",
      value: percent(readyDocuments, overview.total_documents),
      accent: "purple",
    },
    {
      label: "Workflow success",
      value: percent(completedExecutions, executions.length),
      accent: "gold",
    },
  ];
}

export function buildOverviewEmployees(
  employees: AIEmployee[],
  limit = 4,
): OverviewEmployeeItem[] {
  return [...employees]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, limit)
    .map((employee) => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      status: employee.status === "active" ? "active" : "offline",
      tasksToday: null,
    }));
}

function mapExecutionToWorkflowStatus(
  execution: WorkflowExecution | undefined,
  workflow: Workflow,
): OverviewWorkflowDisplayStatus {
  if (!execution) {
    return workflow.status === "active" && workflow.is_active
      ? "scheduled"
      : "scheduled";
  }

  switch (execution.status) {
    case "in_progress":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "scheduled";
  }
}

function executionProgress(status: OverviewWorkflowDisplayStatus): number {
  switch (status) {
    case "completed":
    case "failed":
      return 100;
    case "running":
      return 50;
    default:
      return 0;
  }
}

export function buildOverviewWorkflows(
  workflows: Workflow[],
  executions: WorkflowExecution[],
  limit = 4,
): OverviewWorkflowItem[] {
  const executionsByWorkflow = new Map<string, WorkflowExecution[]>();

  for (const execution of executions) {
    const current = executionsByWorkflow.get(execution.workflow_id) ?? [];
    current.push(execution);
    executionsByWorkflow.set(execution.workflow_id, current);
  }

  return [...workflows]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, limit)
    .map((workflow) => {
      const workflowExecutions = executionsByWorkflow.get(workflow.id) ?? [];
      const latestExecution = [...workflowExecutions].sort(
        (left, right) =>
          new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
      )[0];
      const status = mapExecutionToWorkflowStatus(latestExecution, workflow);
      const runsToday = workflowExecutions.filter((execution) =>
        isToday(execution.updated_at),
      ).length;

      return {
        id: workflow.id,
        name: workflow.name,
        status,
        progress: executionProgress(status),
        runsToday,
      };
    });
}

export function buildOverviewActivity(
  tasks: AgentTask[],
  executions: WorkflowExecution[],
  documents: KnowledgeDocument[],
  workflows: Workflow[],
  limit = 8,
): OverviewActivityItem[] {
  const workflowNames = new Map(
    workflows.map((workflow) => [workflow.id, workflow.name]),
  );

  const taskItems: OverviewActivityItem[] = tasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    description: task.description || `Status: ${task.status.replace("_", " ")}`,
    time: formatRelativeTime(task.updated_at),
    timestamp: task.updated_at,
    type: "agent",
  }));

  const executionItems: OverviewActivityItem[] = executions.map((execution) => ({
    id: `execution-${execution.id}`,
    title: `Workflow ${execution.status.replace("_", " ")}`,
    description:
      workflowNames.get(execution.workflow_id) ??
      execution.error_message ??
      execution.final_output ??
      "Workflow execution updated",
    time: formatRelativeTime(execution.updated_at),
    timestamp: execution.updated_at,
    type: "workflow",
  }));

  const documentItems: OverviewActivityItem[] = documents.map((document) => ({
    id: `document-${document.id}`,
    title:
      document.status === "ready"
        ? "Knowledge base updated"
        : `Document ${document.status}`,
    description: `${document.title} · ${document.chunk_count} chunks`,
    time: formatRelativeTime(document.updated_at),
    timestamp: document.updated_at,
    type: "knowledge",
  }));

  return [...taskItems, ...executionItems, ...documentItems]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, limit);
}

export const platformPulsePlaceholders: OverviewPlatformMetric[] = [
  { label: "Users", value: "—", detail: "Organization members", accent: "emerald" },
  { label: "Teams", value: "—", detail: "Departments", accent: "blue" },
  { label: "Research", value: "—", detail: "Active projects", accent: "purple" },
  { label: "Knowledge index", value: "—", detail: "Indexing status", accent: "gold" },
];

export function buildPlatformPulse(
  overview: DashboardOverview,
  documents: KnowledgeDocument[],
): OverviewPlatformMetric[] {
  const readyDocuments = documents.filter(
    (document) => document.status === "ready",
  ).length;
  const pendingDocuments = documents.filter((document) =>
    ["pending", "processing"].includes(document.status),
  ).length;
  const failedDocuments = documents.filter(
    (document) => document.status === "failed",
  ).length;
  const knowledgeCoverage = percent(readyDocuments, overview.total_documents);

  return [
    {
      label: "Users",
      value: formatCount(overview.total_users),
      detail: "Organization members",
      accent: "emerald",
    },
    {
      label: "Teams",
      value: formatCount(overview.total_teams),
      detail: `${formatCount(overview.total_departments)} departments`,
      accent: "blue",
    },
    {
      label: "Research",
      value: formatCount(overview.total_research_projects),
      detail: "Active projects",
      accent: "purple",
    },
    {
      label: "Knowledge index",
      value: `${knowledgeCoverage}%`,
      detail:
        pendingDocuments > 0
          ? `${pendingDocuments} docs processing`
          : failedDocuments > 0
            ? `${failedDocuments} docs failed`
            : "All indexed",
      accent: "gold",
    },
  ];
}

export function countActivityToday(items: OverviewActivityItem[]): number {
  return items.filter((item) => isToday(item.timestamp)).length;
}
