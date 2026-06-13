import type {
  BrowserAnalytics,
  BrowserProfile,
  BrowserTask,
  BrowserTaskExecutionStatus,
  BrowserTaskStatus,
} from "@/lib/browser-automation/types";

export type {
  BrowserAnalytics,
  BrowserProfile,
  BrowserTask,
  BrowserTaskDetail,
  BrowserTaskExecution,
  BrowserTaskStatus,
  CreateBrowserProfileInput,
  CreateBrowserTaskInput,
  UpdateBrowserProfileInput,
  UpdateBrowserTaskInput,
} from "@/lib/browser-automation/types";

export const browserTaskStatusLabels: Record<BrowserTaskStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  archived: "Archived",
};

export const browserExecutionStatusLabels: Record<BrowserTaskExecutionStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function getProfileInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getTaskInitials(name: string): string {
  return getProfileInitials(name);
}

export function slugifyBrowserName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
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

export function formatViewport(
  width: number | null,
  height: number | null,
): string | null {
  if (width == null || height == null) return null;
  return `${width}×${height}`;
}

export function truncateUrl(url: string | null, maxLength = 48): string {
  if (!url) return "No target URL";
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength - 1)}…`;
}

export function computeBrowserStats(
  profiles: BrowserProfile[],
  tasks: BrowserTask[],
  analytics?: BrowserAnalytics | null,
) {
  if (analytics) {
    return {
      totalProfiles: analytics.total_profiles,
      activeProfiles: analytics.active_profiles,
      totalTasks: analytics.total_tasks,
      readyTasks: analytics.ready_tasks,
      draftTasks: analytics.tasks_by_status.draft ?? 0,
      completedExecutions: analytics.completed_executions,
      totalExecutions: analytics.total_executions,
      recentExecutions: analytics.recent_executions_7d,
      analyticsAvailable: true as const,
    };
  }

  const activeProfiles = profiles.filter((profile) => profile.is_active).length;
  const readyTasks = tasks.filter((task) => task.status === "ready").length;

  return {
    totalProfiles: profiles.length,
    activeProfiles,
    totalTasks: tasks.length,
    readyTasks,
    draftTasks: tasks.filter((task) => task.status === "draft").length,
    completedExecutions: null,
    totalExecutions: null,
    recentExecutions: null,
    analyticsAvailable: false as const,
  };
}

export function countTasksForProfile(tasks: BrowserTask[], profileId: string): number {
  return tasks.filter((task) => task.browser_profile_id === profileId).length;
}

export function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
): string | null {
  if (!startedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));

  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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
