import type {
  AgentTask,
  AgentTeam,
  AgentTeamDetail,
} from "@/lib/agent-teams/types";

export type {
  AgentTask,
  AgentTaskExecution,
  AgentTaskExecutionStatus,
  AgentTaskStatus,
  AgentTeam,
  AgentTeamDetail,
  AgentTeamMember,
  AssignableEmployee,
  CreateTaskInput,
  CreateTeamInput,
  TeamMemberDraft,
  UpdateTeamInput,
} from "@/lib/agent-teams/types";

export const teamStatusLabels = {
  active: "Active",
  inactive: "Inactive",
} as const;

export const taskStatusLabels: Record<
  import("@/lib/agent-teams/types").AgentTaskStatus,
  string
> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const executionStatusLabels: Record<
  import("@/lib/agent-teams/types").AgentTaskExecutionStatus,
  string
> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

export const collaborationRoleSuggestions = [
  "Researcher",
  "Analyst",
  "Writer",
  "Reviewer",
  "Coordinator",
  "Specialist",
] as const;

export function getTeamInitials(name: string): string {
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

export function computeTeamStats(
  teams: AgentTeam[],
  details?: AgentTeamDetail[],
  tasks?: Pick<AgentTask, "status">[],
) {
  const detailById = new Map(details?.map((d) => [d.id, d]) ?? []);

  const withMembers = teams.filter((team) => {
    const detail = detailById.get(team.id);
    if (detail) return detail.members.length > 0;
    return false;
  }).length;

  const totalTasks = tasks?.length ?? 0;
  const completedTasks =
    tasks?.filter((task) => task.status === "completed").length ?? 0;

  return {
    total: teams.length,
    active: teams.filter((team) => team.is_active).length,
    inactive: teams.filter((team) => !team.is_active).length,
    withMembers,
    totalTasks,
    completedTasks,
  };
}

export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
